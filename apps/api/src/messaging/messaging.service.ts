import { BadRequestException, ConflictException, ForbiddenException, Injectable, OnApplicationBootstrap, OnApplicationShutdown, ServiceUnavailableException } from '@nestjs/common';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { DatabaseService } from '../database/database.module';
import { AuthenticatedUser } from '../identity/auth.guard';
import { normalizeLeadPhone } from '../leads/lead-input';
import { NotificationService } from '../operations/notification.service';

type JsonRecord = Record<string, unknown>;
function record(value: unknown): JsonRecord { return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as JsonRecord : {}; }
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function string(value: unknown): string | null { return typeof value === 'string' && value.length ? value : null; }

@Injectable()
export class MessagingService implements OnApplicationBootstrap, OnApplicationShutdown {
  private worker: NodeJS.Timeout | null = null;
  private workerBusy = false;

  constructor(private readonly database: DatabaseService,private readonly notifications:NotificationService) {}

  onApplicationBootstrap() {
    if (!this.isProviderConfigured()) return;
    this.worker = setInterval(() => { void this.processOutbox(); }, 1000);
    this.worker.unref();
  }

  onApplicationShutdown() { if (this.worker) clearInterval(this.worker); }

  verifyChallenge(mode: string | undefined, token: string | undefined, challenge: string | undefined) {
    const expected = process.env.WHATSAPP_VERIFY_TOKEN;
    if (mode !== 'subscribe' || !expected || !token || !challenge) throw new ForbiddenException('Webhook verification failed');
    const actualBytes = Buffer.from(token);
    const expectedBytes = Buffer.from(expected);
    if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) throw new ForbiddenException('Webhook verification failed');
    return challenge;
  }

  rejectInvalidSignature(): never {
    throw new ForbiddenException('WhatsApp webhook signature is invalid');
  }

  async handleWebhook(rawBody: Buffer | undefined, payload: unknown) {
    if (!rawBody || !process.env.WHATSAPP_APP_SECRET) throw new ServiceUnavailableException('WhatsApp webhook verification is not configured');
    if (!record(payload).object || record(payload).object !== 'whatsapp_business_account') throw new BadRequestException('Unsupported webhook object');
    const entries = array(record(payload).entry);
    let processed = 0;
    for (const entryValue of entries) {
      const entry = record(entryValue);
      for (const changeValue of array(entry.changes)) {
        const change = record(changeValue);
        if (change.field !== 'messages') continue;
        const value = record(change.value);
        const metadata = record(value.metadata);
        const configuredPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        if (!configuredPhoneId || metadata.phone_number_id !== configuredPhoneId) throw new ForbiddenException('Webhook phone number does not match the configured account');
        const contacts = array(value.contacts).map(record);
        for (const messageValue of array(value.messages)) {
          const message = record(messageValue);
          const providerId = string(message.id);
          const sender = string(message.from);
          const type = string(message.type) ?? 'unknown';
          if (!providerId || !sender) continue;
          const phone = normalizeLeadPhone(`+${sender}`);
          const contact = contacts.find((candidate) => candidate.wa_id === sender);
          const profile = record(contact?.profile);
          const name = string(profile.name);
          const text = string(record(message.text).body);
          await this.persistInbound(providerId, phone, name, type, text, message, rawBody);
          processed += 1;
        }
        for (const statusValue of array(value.statuses)) {
          const status = record(statusValue);
          const messageId = string(status.id);
          const state = string(status.status);
          const timestamp = string(status.timestamp) ?? '';
          if (!messageId || !state) continue;
          await this.persistDeliveryStatus(`${messageId}:${state}:${timestamp}`, messageId, state, status, rawBody);
          processed += 1;
        }
      }
    }
    return { accepted: true, eventsProcessed: processed };
  }

  async listConversations(actor: AuthenticatedUser, limitValue?: string) {
    const limit = Math.min(100, Math.max(1, Number.parseInt(limitValue ?? '50', 10) || 50));
    const result = await this.database.query(
      `SELECT c.id,c.phone,c.display_name AS "displayName",c.lead_id AS "leadId",c.assigned_to AS "assignedTo",u.display_name AS "assignedAgentName",c.status,c.consent_status AS "consentStatus",c.last_inbound_at AS "lastInboundAt",c.unread_count AS "unreadCount",c.updated_at AS "updatedAt",m.content AS "lastMessage",m.direction AS "lastDirection",m.created_at AS "lastMessageAt",COALESCE(l.source LIKE 'Demo seed %',false) AS "isDemo"
       FROM conversations c LEFT JOIN LATERAL (SELECT content,direction,created_at FROM conversation_messages WHERE organization_id=c.organization_id AND conversation_id=c.id ORDER BY created_at DESC LIMIT 1) m ON true
       LEFT JOIN users u ON u.id=c.assigned_to AND u.organization_id=c.organization_id
       LEFT JOIN leads l ON l.id=c.lead_id AND l.organization_id=c.organization_id
       WHERE c.organization_id=$1 AND c.status='open' AND ($2 IN ('admin','manager') OR c.assigned_to=$3::uuid) ORDER BY c.updated_at DESC LIMIT $4`,
      [this.organizationId, actor.role, actor.id, limit],
    );
    return { data: result.rows };
  }

  async listAssignees(actor:AuthenticatedUser){
    if(!['admin','manager'].includes(actor.role))throw new ForbiddenException('Only admins and managers can view inbox assignment options');
    const result=await this.database.query(`SELECT u.id,u.display_name AS "displayName",p.status FROM users u LEFT JOIN agent_profiles p ON p.organization_id=u.organization_id AND p.user_id=u.id WHERE u.organization_id=$1 AND u.active=true AND u.role='agent' ORDER BY u.display_name`,[this.organizationId]);
    return {data:result.rows};
  }

  async assignConversation(actor:AuthenticatedUser,conversationId:string,agentId:string|null,reason:string){
    if(!['admin','manager'].includes(actor.role))throw new ForbiddenException('Only admins and managers can assign inbox conversations');
    const note=reason.trim();if(note.length<3||note.length>500)throw new BadRequestException('Assignment reason must be 3 to 500 characters');
    return this.database.transaction(async(client)=>{
      const current=await client.query<{assigned_to:string|null}>(`SELECT assigned_to FROM conversations WHERE id=$1 AND organization_id=$2 AND status='open' FOR UPDATE`,[conversationId,this.organizationId]);
      if(!current.rows[0])return null;
      if(agentId===current.rows[0].assigned_to)return {id:conversationId,assignedTo:agentId,unchanged:true};
      if(agentId){
        const agent=await client.query(`SELECT u.id FROM users u LEFT JOIN agent_profiles p ON p.organization_id=u.organization_id AND p.user_id=u.id WHERE u.id=$1 AND u.organization_id=$2 AND u.active=true AND u.role='agent' AND COALESCE(p.status,'available')<>'offline' FOR UPDATE OF u`,[agentId,this.organizationId]);
        if(!agent.rows[0])throw new BadRequestException('Select an active, non-offline agent');
      }
      await client.query(`UPDATE conversations SET assigned_to=$1,updated_at=now() WHERE id=$2 AND organization_id=$3`,[agentId,conversationId,this.organizationId]);
      await client.query(`INSERT INTO conversation_assignment_history (organization_id,conversation_id,previous_assignee,assigned_to,assigned_by,reason) VALUES ($1,$2,$3,$4,$5,$6)`,[this.organizationId,conversationId,current.rows[0].assigned_to,agentId,actor.id,note]);
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'whatsapp.conversation_assigned','conversation',$3,$4::jsonb)`,[this.organizationId,actor.id,conversationId,JSON.stringify({previousAssignee:current.rows[0].assigned_to,assignedTo:agentId,reason:note})]);
      if(agentId)await this.notifications.forUser(client,{organizationId:this.organizationId,userId:agentId,eventKey:`conversation-assigned:${randomUUID()}`,eventType:'whatsapp.conversation_assigned',title:'WhatsApp conversation assigned',body:'A conversation was assigned to your inbox.',link:`/messages?conversation=${conversationId}`,entityType:'conversation',entityId:conversationId,preference:'assignment'});
      return {id:conversationId,assignedTo:agentId};
    });
  }

  async listMessages(actor: AuthenticatedUser, conversationId: string, limitValue?: string) {
    const limit = Math.min(200, Math.max(1, Number.parseInt(limitValue ?? '50', 10) || 50));
    const access = await this.database.query(`SELECT id FROM conversations WHERE id=$1 AND organization_id=$2 AND ($3 IN ('admin','manager') OR assigned_to=$4::uuid)`, [conversationId, this.organizationId, actor.role, actor.id]);
    if (!access.rows[0]) return null;
    const result = await this.database.query(`SELECT id,direction,status,message_type AS "messageType",content,created_at AS "createdAt",sent_at AS "sentAt",delivered_at AS "deliveredAt",read_at AS "readAt" FROM conversation_messages WHERE organization_id=$1 AND conversation_id=$2 ORDER BY created_at DESC LIMIT $3`, [this.organizationId, conversationId, limit]);
    return { data: result.rows.reverse() };
  }

  async queueMessage(actor: AuthenticatedUser, conversationId: string, content: string) {
    if (!this.isProviderConfigured()) throw new ServiceUnavailableException('WhatsApp sending is not configured. Configure the server-side Cloud API credentials first.');
    const text = content.trim();
    if (!text || text.length > 4096) throw new BadRequestException('Message text must contain 1 to 4096 characters');
    return this.database.transaction(async (client) => {
      const conversation = await client.query<{ consent_status: string; last_inbound_at: Date | null; lead_source: string | null }>(
        `SELECT c.consent_status,c.last_inbound_at,l.source AS lead_source FROM conversations c LEFT JOIN leads l ON l.id=c.lead_id AND l.organization_id=c.organization_id WHERE c.id=$1 AND c.organization_id=$2 AND c.status='open' AND ($3 IN ('admin','manager') OR c.assigned_to=$4::uuid) FOR UPDATE OF c`,
        [conversationId, this.organizationId, actor.role, actor.id],
      );
      if (!conversation.rows[0]) return null;
      if (conversation.rows[0].lead_source?.startsWith('Demo seed ')) throw new ForbiddenException('Outbound messaging is disabled for synthetic demo conversations');
      if (conversation.rows[0].consent_status !== 'opted_in') throw new ForbiddenException('Recorded WhatsApp opt-in is required before sending');
      if (!conversation.rows[0].last_inbound_at || Date.now() - new Date(conversation.rows[0].last_inbound_at).getTime() > 24 * 60 * 60 * 1000) {
        throw new ConflictException('The 24-hour reply window has closed. Approved template messages are not enabled yet.');
      }
      const message = await client.query(`INSERT INTO conversation_messages (organization_id,conversation_id,direction,status,content,actor_id) VALUES ($1,$2,'outbound','queued',$3,$4) RETURNING id,status,content,created_at AS "createdAt"`, [this.organizationId, conversationId, text, actor.id]);
      await client.query(`INSERT INTO message_outbox (organization_id,conversation_id,message_id) VALUES ($1,$2,$3)`, [this.organizationId, conversationId, message.rows[0].id]);
      await client.query(`UPDATE conversations SET updated_at=now() WHERE id=$1 AND organization_id=$2`, [conversationId, this.organizationId]);
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'whatsapp.message_queued','conversation',$3,$4::jsonb)`, [this.organizationId, actor.id, conversationId, JSON.stringify({ messageId: message.rows[0].id, length: text.length })]);
      return message.rows[0];
    });
  }

  async updateConsent(actor: AuthenticatedUser, conversationId: string, consent: 'opted_in' | 'opted_out', evidenceSource: string) {
    if (!['admin', 'manager'].includes(actor.role)) throw new ForbiddenException('Only admins and managers can record consent changes');
    const source = evidenceSource.trim();
    if (source.length < 3 || source.length > 300) throw new BadRequestException('Record the source of consent in 3 to 300 characters');
    return this.database.transaction(async (client) => {
      const result = await client.query(`UPDATE conversations SET consent_status=$1,consent_source=$2,consent_recorded_at=now(),updated_at=now() WHERE id=$3 AND organization_id=$4 RETURNING id,consent_status AS "consentStatus",consent_source AS "consentSource",consent_recorded_at AS "consentRecordedAt"`, [consent, source, conversationId, this.organizationId]);
      if (!result.rows[0]) return null;
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'whatsapp.consent_updated','conversation',$3,$4::jsonb)`, [this.organizationId, actor.id, conversationId, JSON.stringify({ consent, source })]);
      return result.rows[0];
    });
  }

  async markRead(actor: AuthenticatedUser, conversationId: string) {
    const result = await this.database.query(`UPDATE conversations SET unread_count=0,updated_at=now() WHERE id=$1 AND organization_id=$2 AND ($3 IN ('admin','manager') OR assigned_to=$4::uuid) RETURNING id`, [conversationId, this.organizationId, actor.role, actor.id]);
    return result.rows[0] ?? null;
  }

  async archive(actor: AuthenticatedUser, conversationId: string) {
    return this.database.transaction(async (client) => {
      const result = await client.query(`UPDATE conversations SET status='archived',updated_at=now() WHERE id=$1 AND organization_id=$2 AND ($3 IN ('admin','manager') OR assigned_to=$4::uuid) RETURNING id`, [conversationId, this.organizationId, actor.role, actor.id]);
      if (!result.rows[0]) return null;
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'whatsapp.conversation_archived','conversation',$3,'{}'::jsonb)`, [this.organizationId, actor.id, conversationId]);
      return result.rows[0];
    });
  }

  private async persistInbound(providerId: string, phone: string, displayName: string | null, type: string, content: string | null, payload: JsonRecord, rawBody: Buffer) {
    await this.database.transaction(async (client) => {
      const receipt = await this.insertReceipt(client, providerId, 'message', rawBody);
      if (!receipt) return;
      const linkedLead = await client.query<{ id: string; assigned_to: string | null }>(`SELECT id,assigned_to FROM leads WHERE organization_id=$1 AND phone=$2 AND archived_at IS NULL ORDER BY created_at LIMIT 1`, [this.organizationId, phone]);
      const conversation = await client.query<{ id: string; assigned_to: string | null }>(
        `INSERT INTO conversations (organization_id,phone,display_name,lead_id,assigned_to) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (organization_id,channel,phone) DO UPDATE SET display_name=COALESCE(EXCLUDED.display_name,conversations.display_name),lead_id=COALESCE(conversations.lead_id,EXCLUDED.lead_id),assigned_to=COALESCE(conversations.assigned_to,EXCLUDED.assigned_to),status='open',updated_at=now()
         RETURNING id,assigned_to`,
        [this.organizationId, phone, displayName, linkedLead.rows[0]?.id ?? null, linkedLead.rows[0]?.assigned_to ?? null],
      );
      const message = await client.query(
        `INSERT INTO conversation_messages (organization_id,conversation_id,provider_message_id,direction,status,message_type,content,payload) VALUES ($1,$2,$3,'inbound','received',$4,$5,$6::jsonb) ON CONFLICT (organization_id,provider_message_id) DO NOTHING RETURNING id`,
        [this.organizationId, conversation.rows[0].id, providerId, type, content, JSON.stringify({ timestamp: payload.timestamp ?? null })],
      );
      if (message.rows[0]) {
        const isOptOut = content !== null && /^(stop|unsubscribe|cancel|end)$/i.test(content.trim());
        await client.query(`UPDATE conversations SET last_inbound_at=now(),unread_count=unread_count+1,consent_status=CASE WHEN $1 THEN 'opted_out' ELSE consent_status END,consent_source=CASE WHEN $1 THEN 'inbound opt-out keyword' ELSE consent_source END,consent_recorded_at=CASE WHEN $1 THEN now() ELSE consent_recorded_at END,updated_at=now() WHERE id=$2`, [isOptOut, conversation.rows[0].id]);
        await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,'whatsapp-webhook', 'whatsapp.message_received','conversation',$2,$3::jsonb)`, [this.organizationId, conversation.rows[0].id, JSON.stringify({ messageId: message.rows[0].id, messageType: type, leadId: linkedLead.rows[0]?.id ?? null })]);
        if (isOptOut) await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,'whatsapp-webhook','whatsapp.consent_opted_out','conversation',$2,'{}'::jsonb)`, [this.organizationId, conversation.rows[0].id]);
        const notificationInput={organizationId:this.organizationId,eventKey:`whatsapp-inbound:${providerId}`,eventType:'whatsapp.message_received',title:'New WhatsApp message',body:'A new inbound message arrived in your inbox.',link:`/messages?conversation=${conversation.rows[0].id}`,entityType:'conversation',entityId:conversation.rows[0].id,preference:'whatsappMessage'};
        if(conversation.rows[0].assigned_to) await this.notifications.forUser(client,{...notificationInput,userId:conversation.rows[0].assigned_to});
        else await this.notifications.forManagers(client,{...notificationInput,actorId:null});
      }
      await client.query(`UPDATE webhook_receipts SET processed_at=now() WHERE id=$1`, [receipt]);
    });
  }

  private async persistDeliveryStatus(eventId: string, messageId: string, status: string, payload: JsonRecord, rawBody: Buffer) {
    const normalized = ['sent', 'delivered', 'read', 'failed'].includes(status) ? status : null;
    if (!normalized) return;
    await this.database.transaction(async (client) => {
      const receipt = await this.insertReceipt(client, eventId, `status.${normalized}`, rawBody);
      if (!receipt) return;
      await client.query(
        `UPDATE conversation_messages SET status=CASE
           WHEN status='read' THEN 'read'
           WHEN $1='read' THEN 'read'
           WHEN $1='delivered' AND status IN ('queued','sent') THEN 'delivered'
           WHEN $1='sent' AND status='queued' THEN 'sent'
           WHEN $1='failed' AND status IN ('queued','sent') THEN 'failed'
           ELSE status END,
         sent_at=CASE WHEN $1 IN ('sent','delivered','read') THEN COALESCE(sent_at,now()) ELSE sent_at END,
         delivered_at=CASE WHEN $1 IN ('delivered','read') THEN COALESCE(delivered_at,now()) ELSE delivered_at END,
         read_at=CASE WHEN $1='read' THEN COALESCE(read_at,now()) ELSE read_at END
         WHERE organization_id=$2 AND provider_message_id=$3`,
        [normalized, this.organizationId, messageId],
      );
      await client.query(`UPDATE webhook_receipts SET processed_at=now() WHERE id=$1`, [receipt]);
    });
  }

  private async insertReceipt(client: import('pg').PoolClient, eventId: string, eventType: string, rawBody: Buffer): Promise<string | null> {
    const result = await client.query<{ id: string }>(`INSERT INTO webhook_receipts (organization_id,provider,provider_event_id,event_type,body_hash) VALUES ($1,'whatsapp_cloud',$2,$3,$4) ON CONFLICT (organization_id,provider,provider_event_id) DO NOTHING RETURNING id`, [this.organizationId, eventId, eventType, createHash('sha256').update(rawBody).digest('hex')]);
    return result.rows[0]?.id ?? null;
  }

  private async processOutbox() {
    if (this.workerBusy) return;
    this.workerBusy = true;
    try {
      const job = await this.database.transaction(async (client) => {
        const claimed = await client.query<{ id: string; message_id: string; conversation_id: string }>(
          `UPDATE message_outbox SET state='processing',attempts=attempts+1,locked_at=now()
           WHERE id=(SELECT id FROM message_outbox WHERE (state='pending' AND available_at<=now()) OR (state='processing' AND locked_at<now()-interval '5 minutes') ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id,message_id,conversation_id`,
        );
        if (!claimed.rows[0]) return null;
        const joined = await client.query<{ id: string; message_id: string; content: string; phone: string; consent_status: string; last_inbound_at: Date | null; attempts: number }>(`SELECT o.id,o.message_id,m.content,c.phone,c.consent_status,c.last_inbound_at,o.attempts FROM message_outbox o JOIN conversation_messages m ON m.id=o.message_id JOIN conversations c ON c.id=o.conversation_id WHERE o.id=$1`, [claimed.rows[0].id]);
        return joined.rows[0] ?? null;
      });
      if (!job) return;
      if (job.consent_status !== 'opted_in' || !job.last_inbound_at || Date.now() - new Date(job.last_inbound_at).getTime() > 24 * 60 * 60 * 1000) {
        await this.finishOutbox(job.id, job.message_id, null, 'consent_or_reply_window_expired');
        return;
      }
      const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const token = process.env.WHATSAPP_ACCESS_TOKEN;
      if (!apiVersion || !phoneId || !token) return;
      try {
        const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneId}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: job.phone, type: 'text', text: { preview_url: false, body: job.content } }),
          signal: AbortSignal.timeout(10000),
        });
        const body = record(await response.json().catch(() => ({})));
        const messages = array(body.messages);
        const providerMessageId = string(record(messages[0]).id);
        if (!response.ok || !providerMessageId) throw new Error(`provider_http_${response.status}`);
        await this.finishOutbox(job.id, job.message_id, providerMessageId, null);
      } catch (error) {
        const maxAttempts = 8;
        const terminal = Number(job.attempts) >= maxAttempts;
        const safeCode = error instanceof Error && /^provider_http_\d+$/.test(error.message) ? error.message : 'provider_unavailable';
        await this.retryOutbox(job.id, job.message_id, safeCode, terminal, Number(job.attempts));
      }
    } catch {
      // Worker errors are deliberately not logged with provider bodies or customer content.
    } finally {
      this.workerBusy = false;
    }
  }

  private async finishOutbox(outboxId: string, messageId: string, providerMessageId: string | null, failure: string | null) {
    await this.database.transaction(async (client) => {
      await client.query(`UPDATE message_outbox SET state=$1,locked_at=NULL,last_error=$2 WHERE id=$3`, [failure ? 'failed' : 'sent', failure, outboxId]);
      await client.query(`UPDATE conversation_messages SET status=$1,provider_message_id=$2,sent_at=CASE WHEN $1='sent' THEN now() ELSE sent_at END WHERE id=$3 AND organization_id=$4`, [failure ? 'failed' : 'sent', providerMessageId, messageId, this.organizationId]);
    });
  }

  private async retryOutbox(outboxId: string, messageId: string, errorCode: string, terminal: boolean, attempts: number) {
    const delaySeconds = Math.min(3600, 5 * 2 ** Math.min(attempts, 10));
    await this.database.transaction(async (client) => {
      await client.query(`UPDATE message_outbox SET state=$1,locked_at=NULL,last_error=$2,available_at=now()+($3 * interval '1 second') WHERE id=$4`, [terminal ? 'failed' : 'pending', errorCode, delaySeconds, outboxId]);
      if (terminal) await client.query(`UPDATE conversation_messages SET status='failed' WHERE id=$1 AND organization_id=$2`, [messageId, this.organizationId]);
    });
  }

  private get organizationId() {
    const id = process.env.ORGANIZATION_ID;
    if (!id) throw new Error('ORGANIZATION_ID must be configured');
    return id;
  }

  private isProviderConfigured() {
    return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && /^v\d+\.\d+$/.test(process.env.WHATSAPP_GRAPH_API_VERSION ?? ''));
  }
}
