import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { DatabaseService } from '../database/database.module';
import { AuthenticatedUser } from '../identity/auth.guard';

export const preferenceSchema = z.object({ newLead: z.boolean(), assignment: z.boolean(), whatsappMessage: z.boolean(), stageUpdate: z.boolean() }).strict();
export type NotificationPreferences = z.infer<typeof preferenceSchema>;
const defaultPreferences: NotificationPreferences = { newLead: true, assignment: true, whatsappMessage: true, stageUpdate: true };

export function escapeLikeQuery(query:string){return query.replace(/[!%_]/g,'!$&');}

export function assertExpectedVersion(expectedVersion: number, currentVersion: number | null) {
  if ((currentVersion ?? 0) !== expectedVersion) {
    throw new ConflictException('Notification preferences changed since they were loaded. Reload before saving.');
  }
}

@Injectable()
export class OperationsService {
  constructor(private readonly database: DatabaseService) {}

  async search(actor:AuthenticatedUser,rawQuery?:string){
    const query=rawQuery?.trim().slice(0,100)??'';
    if(query.length<2)throw new BadRequestException('Enter at least two characters to search');
    const escaped=escapeLikeQuery(query);
    const [leads,conversations]=await Promise.all([
      this.database.query(`SELECT id,name,phone,status,updated_at AS "updatedAt" FROM leads WHERE organization_id=$1 AND archived_at IS NULL AND ($2 IN ('admin','manager') OR assigned_to=$3::uuid OR created_by=$3) AND (name ILIKE '%'||$4||'%' ESCAPE '!' OR phone ILIKE '%'||$4||'%' ESCAPE '!' OR email ILIKE '%'||$4||'%' ESCAPE '!') ORDER BY updated_at DESC LIMIT 5`,[this.organizationId,actor.role,actor.id,escaped]),
      this.database.query(`SELECT c.id,COALESCE(c.display_name,c.phone) AS name,c.phone,m.content AS "lastMessage",c.updated_at AS "updatedAt" FROM conversations c LEFT JOIN LATERAL (SELECT content FROM conversation_messages WHERE organization_id=c.organization_id AND conversation_id=c.id ORDER BY created_at DESC LIMIT 1) m ON true WHERE c.organization_id=$1 AND c.status='open' AND ($2 IN ('admin','manager') OR c.assigned_to=$3::uuid) AND (c.phone ILIKE '%'||$4||'%' ESCAPE '!' OR c.display_name ILIKE '%'||$4||'%' ESCAPE '!' OR EXISTS (SELECT 1 FROM conversation_messages cm WHERE cm.organization_id=c.organization_id AND cm.conversation_id=c.id AND cm.content ILIKE '%'||$4||'%' ESCAPE '!')) ORDER BY c.updated_at DESC LIMIT 5`,[this.organizationId,actor.role,actor.id,escaped]),
    ]);
    return {data:{leads:leads.rows,conversations:conversations.rows}};
  }

  async listNotifications(actor: AuthenticatedUser, limitValue?: string) {
    const limit = Math.min(50,Math.max(1,Number.parseInt(limitValue ?? '25',10)||25));
    const result = await this.database.query(
      `SELECT id,event_type AS type,title,body AS message,link,created_at AS "createdAt",read_at AS "readAt" FROM user_notifications WHERE organization_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT $3`,
      [this.organizationId,actor.id,limit],
    );
    const unread = await this.database.query<{ count: number }>(`SELECT count(*)::int AS count FROM user_notifications WHERE organization_id=$1 AND user_id=$2 AND read_at IS NULL`,[this.organizationId,actor.id]);
    return { data: result.rows, unreadCount: unread.rows[0]?.count ?? 0 };
  }

  async markNotificationRead(actor: AuthenticatedUser, notificationId: string) {
    const result = await this.database.query(`UPDATE user_notifications SET read_at=COALESCE(read_at,now()) WHERE id=$1 AND organization_id=$2 AND user_id=$3 RETURNING id,read_at AS "readAt"`,[notificationId,this.organizationId,actor.id]);
    return result.rows[0] ?? null;
  }

  async markAllNotificationsRead(actor: AuthenticatedUser) {
    const result = await this.database.query(`UPDATE user_notifications SET read_at=now() WHERE organization_id=$1 AND user_id=$2 AND read_at IS NULL`,[this.organizationId,actor.id]);
    return { updated: result.rowCount ?? 0 };
  }

  async getSettings() {
    const result = await this.database.query(
      `SELECT o.name AS "organizationName",s.default_currency AS "defaultCurrency",s.version,s.updated_at AS "updatedAt",s.updated_by AS "updatedBy" FROM organizations o JOIN organization_app_settings s ON s.organization_id=o.id WHERE o.id=$1`,
      [this.organizationId],
    );
    return { organization: result.rows[0] ?? null, integrations: { googleWorkspace: Boolean(process.env.OIDC_AUDIENCE && process.env.OIDC_ISSUER_URL && process.env.OIDC_JWKS_URL && process.env.OIDC_EMAIL_DOMAIN), whatsappCloud: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_APP_SECRET && process.env.WHATSAPP_VERIFY_TOKEN && /^v\d+\.\d+$/.test(process.env.WHATSAPP_GRAPH_API_VERSION ?? '')) } };
  }

  async updateOrganizationSettings(actor: AuthenticatedUser, input: { expectedVersion: number; organizationName: string; defaultCurrency: string }) {
    if (actor.role !== 'admin') throw new ForbiddenException('Only admins can change organization settings');
    const name=input.organizationName.trim();
    if(name.length<2||name.length>120)throw new BadRequestException('Organization name must be 2 to 120 characters');
    return this.database.transaction(async (client) => {
      const current=await client.query<{version:number}>(`SELECT version FROM organization_app_settings WHERE organization_id=$1 FOR UPDATE`,[this.organizationId]);
      if(!current.rows[0])throw new NotFoundException('Organization settings are not initialized. Apply database migrations first.');
      if(current.rows[0].version!==input.expectedVersion)throw new ConflictException('Organization settings changed since they were loaded. Reload before saving.');
      const updated=await client.query(`UPDATE organization_app_settings SET default_currency=$1,version=version+1,updated_by=$2,updated_at=now() WHERE organization_id=$3 RETURNING version,updated_at AS "updatedAt",updated_by AS "updatedBy"`,[input.defaultCurrency,actor.id,this.organizationId]);
      await client.query(`UPDATE organizations SET name=$1 WHERE id=$2`,[name,this.organizationId]);
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,payload) VALUES ($1,$2,'organization.settings_updated','organization',$3::jsonb)`,[this.organizationId,actor.id,JSON.stringify({organizationName:name,defaultCurrency:input.defaultCurrency,version:updated.rows[0].version})]);
      return { organizationName:name,defaultCurrency:input.defaultCurrency,...updated.rows[0] };
    });
  }

  async getPreferences(actor: AuthenticatedUser) {
    const result=await this.database.query(`SELECT preferences,version,updated_at AS "updatedAt" FROM user_notification_preferences WHERE organization_id=$1 AND user_id=$2`,[this.organizationId,actor.id]);
    const row=result.rows[0];
    return { preferences:row?.preferences ?? defaultPreferences,version:row?.version ?? 0,updatedAt:row?.updatedAt ?? null };
  }

  async updatePreferences(actor: AuthenticatedUser,input:{expectedVersion:number;preferences:unknown}) {
    const parsed=preferenceSchema.safeParse(input.preferences);
    if(!parsed.success)throw new BadRequestException(parsed.error.issues.map((issue)=>`${issue.path.join('.')}: ${issue.message}`).join(', '));
    return this.database.transaction(async(client)=>{
      const current=await client.query<{version:number}>(`SELECT version FROM user_notification_preferences WHERE organization_id=$1 AND user_id=$2 FOR UPDATE`,[this.organizationId,actor.id]);
      assertExpectedVersion(input.expectedVersion,current.rows[0]?.version ?? null);
      const result=current.rows[0]
        ? await client.query(`UPDATE user_notification_preferences SET preferences=$3::jsonb,version=version+1,updated_at=now() WHERE organization_id=$1 AND user_id=$2 RETURNING preferences,version,updated_at AS "updatedAt"`,[this.organizationId,actor.id,JSON.stringify(parsed.data)])
        : await client.query(`INSERT INTO user_notification_preferences (organization_id,user_id,preferences,version) VALUES ($1,$2,$3::jsonb,1) ON CONFLICT (organization_id,user_id) DO NOTHING RETURNING preferences,version,updated_at AS "updatedAt"`,[this.organizationId,actor.id,JSON.stringify(parsed.data)]);
      if(!result.rows[0])throw new ConflictException('Notification preferences changed since they were loaded. Reload before saving.');
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'notification.preferences_updated','user_notification_preferences',$3,$4::jsonb)`,[this.organizationId,actor.id,actor.id,JSON.stringify({preferences:parsed.data,version:result.rows[0].version})]);
      return result.rows[0];
    });
  }

  async listMembers(actor: AuthenticatedUser) {
    this.requireAdmin(actor);
    const result=await this.database.query(`SELECT id,email,display_name AS "displayName",role,active,(auth_subject IS NOT NULL) AS "identityBound",created_at AS "createdAt" FROM users WHERE organization_id=$1 ORDER BY lower(display_name),lower(email)`,[this.organizationId]);
    return {data:result.rows};
  }

  async createMember(actor: AuthenticatedUser,input:{email:string;displayName:string;role:AuthenticatedUser['role']}) {
    this.requireAdmin(actor);
    const email=input.email.trim().toLowerCase();
    const displayName=input.displayName.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new BadRequestException('Enter a valid email address');
    if(displayName.length<2||displayName.length>120)throw new BadRequestException('Name must be 2 to 120 characters');
    const workspaceDomain=process.env.OIDC_EMAIL_DOMAIN?.trim().toLowerCase();
    if(workspaceDomain&&email.split('@').at(-1)!==workspaceDomain)throw new BadRequestException('Member email must belong to the configured Workspace domain');
    try {
      return await this.database.transaction(async(client)=>{
        const inserted=await client.query(`INSERT INTO users (organization_id,auth_subject,email,display_name,role) VALUES ($1,NULL,$2,$3,$4) RETURNING id,email,display_name AS "displayName",role,active,false AS "identityBound",created_at AS "createdAt"`,[this.organizationId,email,displayName,input.role]);
        const member=inserted.rows[0];
        if(input.role==='agent')await client.query(`INSERT INTO agent_profiles (organization_id,user_id) VALUES ($1,$2) ON CONFLICT (organization_id,user_id) DO NOTHING`,[this.organizationId,member.id]);
        await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'organization.member_created','user',$3,$4::jsonb)`,[this.organizationId,actor.id,member.id,JSON.stringify({email,displayName,role:input.role})]);
        return member;
      });
    } catch(error) {
      if(typeof error==='object'&&error!==null&&'code' in error&&(error as {code?:string}).code==='23505')throw new ConflictException('A member with this email already exists');
      throw error;
    }
  }

  async updateMember(actor:AuthenticatedUser,userId:string,input:{displayName:string;role:AuthenticatedUser['role'];active:boolean}) {
    this.requireAdmin(actor);
    const displayName=input.displayName.trim();
    if(displayName.length<2||displayName.length>120)throw new BadRequestException('Name must be 2 to 120 characters');
    return this.database.transaction(async(client)=>{
      await client.query(`SELECT id FROM organizations WHERE id=$1 FOR UPDATE`,[this.organizationId]);
      const current=await client.query<{role:string;active:boolean}>(`SELECT role,active FROM users WHERE id=$1 AND organization_id=$2 FOR UPDATE`,[userId,this.organizationId]);
      if(!current.rows[0])throw new NotFoundException('Member not found');
      if(current.rows[0].role==='admin'&&current.rows[0].active&&(!input.active||input.role!=='admin')) {
        const admins=await client.query<{count:number}>(`SELECT count(*)::int AS count FROM users WHERE organization_id=$1 AND role='admin' AND active=true`,[this.organizationId]);
        if((admins.rows[0]?.count??0)<=1)throw new ConflictException('The organization must keep at least one active admin');
      }
      const result=await client.query(`UPDATE users SET display_name=$1,role=$2,active=$3 WHERE id=$4 AND organization_id=$5 RETURNING id,email,display_name AS "displayName",role,active,(auth_subject IS NOT NULL) AS "identityBound",created_at AS "createdAt"`,[displayName,input.role,input.active,userId,this.organizationId]);
      if(input.role==='agent'&&input.active)await client.query(`INSERT INTO agent_profiles (organization_id,user_id,status) VALUES ($1,$2,'available') ON CONFLICT (organization_id,user_id) DO UPDATE SET status=CASE WHEN agent_profiles.status='offline' THEN 'available' ELSE agent_profiles.status END,updated_at=now()`,[this.organizationId,userId]);
      else await client.query(`UPDATE agent_profiles SET status='offline',updated_at=now() WHERE organization_id=$1 AND user_id=$2`,[this.organizationId,userId]);
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'organization.member_updated','user',$3,$4::jsonb)`,[this.organizationId,actor.id,userId,JSON.stringify({displayName,role:input.role,active:input.active})]);
      return result.rows[0];
    });
  }

  private requireAdmin(actor:AuthenticatedUser){if(actor.role!=='admin')throw new ForbiddenException('Only admins can manage organization members');}

  private get organizationId(){const value=process.env.ORGANIZATION_ID;if(!value)throw new Error('ORGANIZATION_ID must be configured');return value;}
}
