import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.module';
import { AuthenticatedUser } from '../identity/auth.guard';
import { normalizeLeadPhone, validateBudget } from './lead-input';
import { assertLeadTransition } from './lead-workflow';
import { NotificationService } from '../operations/notification.service';

interface CreateLeadInput { name: string; phone: string; email?: string; source?: string; notes?: string; intent?: string; timeline?: string; region?: string; propertyType?: string; budgetCurrency?: string; budgetAmount?: number; }
interface UpdateLeadInput { name?: string; phone?: string; email?: string | null; source?: string; notes?: string | null; intent?: string | null; timeline?: string | null; region?: string | null; propertyType?: string | null; budgetCurrency?: string | null; budgetAmount?: number | null; }

@Injectable()
export class LeadsService {
  constructor(private readonly database: DatabaseService, private readonly notifications: NotificationService) {}

  async list(actor: AuthenticatedUser, rawLimit?: string, rawOffset?: string, rawSearch?: string, rawStatus?: string) {
    const limit = Math.min(100, Math.max(1, Number.parseInt(rawLimit ?? '25', 10) || 25));
    const offset = Math.max(0, Number.parseInt(rawOffset ?? '0', 10) || 0);
    const search = rawSearch?.trim().slice(0, 120) || null;
    const statuses = ['new', 'qualifying', 'qualified', 'assigned', 'contacted', 'meeting_scheduled', 'nurture', 'won', 'lost'];
    if (rawStatus && !statuses.includes(rawStatus)) throw new BadRequestException('Unsupported lead status filter');
    const result = await this.database.query(
      `SELECT id, name, phone, email, budget_amount AS "budgetAmount", budget_currency AS "budgetCurrency", status, source, intent,timeline,region,property_type AS "propertyType",score,assigned_to AS "assignedTo", created_at AS "createdAt" FROM leads WHERE organization_id = $1 AND archived_at IS NULL AND ($2 IN ('admin','manager') OR assigned_to = $3::uuid OR created_by = $4) AND ($5::text IS NULL OR name ILIKE '%' || $5 || '%' OR phone ILIKE '%' || $5 || '%' OR email ILIKE '%' || $5 || '%') AND ($6::text IS NULL OR status = $6) ORDER BY created_at DESC LIMIT $7 OFFSET $8`,
      [this.organizationId, actor.role, actor.id, actor.id, search, rawStatus ?? null, limit + 1, offset],
    );
    return { data: result.rows.slice(0, limit), page: { limit, offset, hasMore: result.rows.length > limit, search, status: rawStatus ?? null } };
  }

  async exportRecords(actor: AuthenticatedUser, rawSearch?: string, rawStatus?: string) {
    if (!['admin','manager'].includes(actor.role)) throw new ForbiddenException('Only admins and managers can export lead records');
    const allowed = ['new','qualifying','qualified','assigned','contacted','meeting_scheduled','nurture','won','lost'];
    if (rawStatus && !allowed.includes(rawStatus)) throw new BadRequestException('Unsupported lead status filter');
    const search = rawSearch?.trim().slice(0,120) || null;
    return this.database.transaction(async (client) => {
      const result = await client.query(
        `SELECT id,name,phone,email,budget_amount AS "budgetAmount",budget_currency AS "budgetCurrency",status,source,notes,intent,timeline,region,property_type AS "propertyType",score,created_at AS "createdAt",updated_at AS "updatedAt" FROM leads WHERE organization_id=$1 AND archived_at IS NULL AND ($2::text IS NULL OR name ILIKE '%'||$2||'%' OR phone ILIKE '%'||$2||'%' OR email ILIKE '%'||$2||'%') AND ($3::text IS NULL OR status=$3) ORDER BY created_at DESC LIMIT 10001`,
        [this.organizationId,search,rawStatus ?? null],
      );
      const truncated = result.rows.length > 10000;
      const data = result.rows.slice(0,10000);
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,payload) VALUES ($1,$2,'lead.exported','lead_export',$3::jsonb)`, [this.organizationId,actor.id,JSON.stringify({ count:data.length,truncated,search,status:rawStatus ?? null })]);
      return { data, truncated, limit:10000 };
    });
  }

  async update(actor: AuthenticatedUser, leadId: string, input: UpdateLeadInput) {
    if (input.budgetAmount !== undefined || input.budgetCurrency !== undefined) {
      validateBudget(input.budgetAmount === undefined ? undefined : input.budgetAmount ?? undefined, input.budgetCurrency === undefined ? undefined : input.budgetCurrency ?? undefined);
    }
    const assignments: string[] = [];
    const values: unknown[] = [];
    const add = (column: string, value: unknown) => { values.push(value); assignments.push(`${column} = $${values.length}`); };
    if (input.name !== undefined) add('name', input.name.trim());
    if (input.phone !== undefined) add('phone', normalizeLeadPhone(input.phone));
    if (input.email !== undefined) add('email', input.email?.toLowerCase() ?? null);
    if (input.source !== undefined) add('source', input.source);
    if (input.notes !== undefined) add('notes', input.notes);
    if (input.intent !== undefined) add('intent', input.intent);
    if (input.timeline !== undefined) add('timeline', input.timeline);
    if (input.region !== undefined) add('region', input.region);
    if (input.propertyType !== undefined) add('property_type', input.propertyType);
    if (input.budgetAmount !== undefined) add('budget_amount', input.budgetAmount);
    if (input.budgetCurrency !== undefined) add('budget_currency', input.budgetCurrency);
    if (!assignments.length) throw new BadRequestException('At least one field must be provided');
    values.push(leadId, this.organizationId, actor.role, actor.id, actor.id);
    try { return await this.database.transaction(async (client) => {
      const before = await client.query(`SELECT id FROM leads WHERE id=$1 AND organization_id=$2 AND archived_at IS NULL AND ($3 IN ('admin','manager') OR assigned_to=$4::uuid OR created_by=$5) FOR UPDATE`, values.slice(-5));
      if (!before.rows[0]) return null;
      const updated = await client.query(`UPDATE leads SET ${assignments.join(', ')}, updated_at=now() WHERE id=$${values.length - 4} AND organization_id=$${values.length - 3} RETURNING id, name, phone, email, budget_amount AS "budgetAmount", budget_currency AS "budgetCurrency", status, source, notes, updated_at AS "updatedAt"`, values);
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'lead.updated','lead',$3,$4::jsonb)`, [this.organizationId, actor.id, leadId, JSON.stringify({ fields: Object.keys(input) })]);
      return updated.rows[0];
    }); } catch (error) { this.throwDuplicatePhone(error); }
  }

  async activity(actor: AuthenticatedUser, leadId: string) {
    const access = await this.database.query(
      `SELECT 1 FROM leads WHERE id=$1 AND organization_id=$2 AND archived_at IS NULL AND ($3 IN ('admin','manager') OR assigned_to=$4::uuid OR created_by=$5)`,
      [leadId, this.organizationId, actor.role, actor.id, actor.id],
    );
    if (!access.rows[0]) return null;
    const result = await this.database.query(
      `SELECT events.kind, events.details, COALESCE(users.display_name, events.actor_id) AS "actorName", events.occurred_at AS "occurredAt" FROM (
         SELECT 'stage'::text AS kind, jsonb_build_object('from',from_status,'to',to_status,'reason',reason) AS details, actor_id, created_at AS occurred_at
         FROM lead_stage_transitions WHERE organization_id=$1 AND lead_id=$2
         UNION ALL
         SELECT CASE WHEN unassigned_at IS NULL THEN 'assignment' ELSE 'assignment_released' END, jsonb_build_object('agentId',agent_id,'assignedBy',assigned_by,'reason',reason), COALESCE(unassigned_by,assigned_by), COALESCE(unassigned_at,assigned_at)
         FROM lead_assignments WHERE organization_id=$1 AND lead_id=$2
         UNION ALL
         SELECT event_type, payload, actor_id, created_at FROM audit_events
         WHERE organization_id=$1 AND entity_type='lead' AND entity_id=$2 AND event_type NOT IN ('lead.status_changed','lead.assigned')
       ) AS events LEFT JOIN users ON users.id::text=events.actor_id AND users.organization_id=$1 ORDER BY events.occurred_at DESC LIMIT 100`,
      [this.organizationId, leadId],
    );
    return { data: result.rows };
  }

  async archive(actor: AuthenticatedUser, leadId: string) {
    try { return await this.database.transaction(async (client) => {
      const result = await client.query(`UPDATE leads SET archived_at=now(), updated_at=now() WHERE id=$1 AND organization_id=$2 AND archived_at IS NULL AND ($3 IN ('admin','manager') OR assigned_to=$4::uuid OR created_by=$5) RETURNING id`, [leadId, this.organizationId, actor.role, actor.id, actor.id]);
      if (!result.rows[0]) return null;
      await client.query(`UPDATE lead_assignments SET unassigned_at=now(),unassigned_by=$3 WHERE organization_id=$1 AND lead_id=$2 AND unassigned_at IS NULL`, [this.organizationId, leadId, actor.id]);
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'lead.archived','lead',$3,'{}'::jsonb)`, [this.organizationId, actor.id, leadId]);
      return { id: leadId, archived: true };
    }); } catch (error) { this.throwDuplicatePhone(error); }
  }

  async create(actorId: string, input: CreateLeadInput) {
    const id = randomUUID();
    const phone = normalizeLeadPhone(input.phone);
    validateBudget(input.budgetAmount, input.budgetCurrency);
    try { return await this.database.transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO leads (id, organization_id, name, phone, email, source, notes, intent, timeline, region, property_type, budget_amount, budget_currency, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id, name, phone, email, budget_amount AS "budgetAmount", budget_currency AS "budgetCurrency", status, source, created_at AS "createdAt"`,
        [id, this.organizationId, input.name.trim(), phone, input.email?.toLowerCase() ?? null, input.source ?? 'Manual', input.notes ?? null, input.intent ?? null, input.timeline ?? null, input.region ?? null, input.propertyType ?? null, input.budgetAmount ?? null, input.budgetCurrency ?? null, actorId],
      );
      await client.query(
        `INSERT INTO audit_events (organization_id, actor_id, event_type, entity_type, entity_id, payload) VALUES ($1,$2,'lead.created','lead',$3,$4::jsonb)`,
        [this.organizationId, actorId, id, JSON.stringify({ source: input.source ?? 'Manual' })],
      );
      await client.query(
        `INSERT INTO lead_stage_transitions (organization_id, lead_id, from_status, to_status, actor_id) VALUES ($1,$2,NULL,'new',$3)`,
        [this.organizationId, id, actorId],
      );
      await this.notifications.forManagers(client,{organizationId:this.organizationId,actorId,eventKey:`lead-created:${id}`,eventType:'lead.created',title:'New lead added',body:'A new lead was added to the CRM.',link:'/leads',entityType:'lead',entityId:id,preference:'newLead'});
      return result.rows[0];
    }); } catch (error) { this.throwDuplicatePhone(error); }
  }

  async changeStatus(actor: AuthenticatedUser, leadId: string, nextStatus: string, reason?: string) {
    return this.database.transaction(async (client) => {
      const current = await client.query<{ status: string; assigned_to: string | null }>(
        `SELECT status,assigned_to FROM leads WHERE id = $1 AND organization_id = $2 AND archived_at IS NULL AND ($3 IN ('admin','manager') OR assigned_to = $4::uuid OR created_by = $4) FOR UPDATE`,
        [leadId, this.organizationId, actor.role, actor.id],
      );
      if (!current.rows[0]) return null;
      const previous = current.rows[0].status;
      assertLeadTransition(previous, nextStatus);
      const updated = await client.query(
        `UPDATE leads SET status = $1, updated_at = now() WHERE id = $2 AND organization_id = $3 RETURNING id, name, status, updated_at AS "updatedAt"`,
        [nextStatus, leadId, this.organizationId],
      );
      const transition = await client.query<{ id: string }>(
        `INSERT INTO lead_stage_transitions (organization_id, lead_id, from_status, to_status, reason, actor_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [this.organizationId, leadId, previous, nextStatus, reason ?? null, actor.id],
      );
      await client.query(
        `INSERT INTO audit_events (organization_id, actor_id, event_type, entity_type, entity_id, payload) VALUES ($1,$2,'lead.status_changed','lead',$3,$4::jsonb)`,
        [this.organizationId, actor.id, leadId, JSON.stringify({ from: previous, to: nextStatus, reason: reason ?? null })],
      );
      if(current.rows[0].assigned_to && current.rows[0].assigned_to!==actor.id){
        await this.notifications.forUser(client,{organizationId:this.organizationId,userId:current.rows[0].assigned_to,eventKey:`lead-stage:${transition.rows[0].id}`,eventType:'lead.stage_changed',title:'Lead stage changed',body:`A lead moved to ${nextStatus.replace(/_/g,' ')}.`,link:'/pipeline',entityType:'lead',entityId:leadId,preference:'stageUpdate'});
      }
      return updated.rows[0];
    });
  }

  async assignToSelf(actor: AuthenticatedUser, leadId: string) {
    return this.database.transaction(async (client) => {
      const current = await client.query<{ status: string; assigned_to: string | null }>(
        `SELECT status, assigned_to FROM leads WHERE id = $1 AND organization_id = $2 AND archived_at IS NULL AND ($3 IN ('admin','manager') OR assigned_to = $4::uuid OR created_by = $4) FOR UPDATE`,
        [leadId, this.organizationId, actor.role, actor.id],
      );
      if (!current.rows[0]) return null;
      if (!['qualified', 'assigned'].includes(current.rows[0].status)) {
        throw new BadRequestException('Only qualified leads can be assigned');
      }
      const fromStatus = current.rows[0].status;
      if (fromStatus === 'assigned' && current.rows[0].assigned_to === actor.id) return { id: leadId, status: 'assigned', assignedTo: actor.id };
      const profile = await client.query<{ status: string; max_active_leads: number }>(
        `SELECT status, max_active_leads FROM agent_profiles WHERE organization_id = $1 AND user_id = $2::uuid FOR UPDATE`,
        [this.organizationId, actor.id],
      );
      if (!profile.rows[0] || profile.rows[0].status !== 'available') throw new BadRequestException('Your agent profile is not available for assignment');
      const load = await client.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM lead_assignments WHERE organization_id = $1 AND agent_id = $2::uuid AND unassigned_at IS NULL`,
        [this.organizationId, actor.id],
      );
      if (Number(load.rows[0]?.count ?? 0) >= profile.rows[0].max_active_leads) throw new BadRequestException('Your active lead capacity is full');
      await client.query(
        `UPDATE lead_assignments SET unassigned_at = now(), unassigned_by = $3 WHERE organization_id = $1 AND lead_id = $2 AND unassigned_at IS NULL`,
        [this.organizationId, leadId, actor.id],
      );
      await client.query(
        `INSERT INTO lead_assignments (organization_id, lead_id, agent_id, assigned_by, reason) VALUES ($1,$2,$3,$4,'manual self-assignment')`,
        [this.organizationId, leadId, actor.id, actor.id],
      );
      const updated = await client.query(
        `UPDATE leads SET assigned_to = $1::uuid, status = 'assigned', updated_at = now() WHERE id = $2 AND organization_id = $3 RETURNING id, name, status, assigned_to AS "assignedTo"`,
        [actor.id, leadId, this.organizationId],
      );
      if (fromStatus !== 'assigned') {
        await client.query(
          `INSERT INTO lead_stage_transitions (organization_id, lead_id, from_status, to_status, reason, actor_id) VALUES ($1,$2,$3,'assigned','manual self-assignment',$4)`,
          [this.organizationId, leadId, fromStatus, actor.id],
        );
      }
      await client.query(
        `INSERT INTO audit_events (organization_id, actor_id, event_type, entity_type, entity_id, payload) VALUES ($1,$2,'lead.assigned','lead',$3,$4::jsonb)`,
        [this.organizationId, actor.id, leadId, JSON.stringify({ agentId: actor.id, previousAssignee: current.rows[0].assigned_to })],
      );
      return updated.rows[0];
    });
  }

  async assign(actor:AuthenticatedUser,leadId:string,agentId:string,reason:string) {
    if(!['admin','manager'].includes(actor.role))throw new ForbiddenException('Only admins and managers can assign leads');
    return this.database.transaction(async(client)=>{
      const leadResult=await client.query<{status:string;assigned_to:string|null}>(`SELECT status,assigned_to FROM leads WHERE id=$1 AND organization_id=$2 AND archived_at IS NULL FOR UPDATE`,[leadId,this.organizationId]);
      const lead=leadResult.rows[0];if(!lead)return null;
      if(!['qualified','assigned'].includes(lead.status))throw new BadRequestException('Only qualified leads can be assigned');
      const target=await client.query<{status:string;max_active_leads:number}>(`SELECT profile.status,profile.max_active_leads FROM agent_profiles profile JOIN users ON users.id=profile.user_id AND users.organization_id=profile.organization_id WHERE profile.organization_id=$1 AND profile.user_id=$2 AND users.active=true AND users.role='agent' FOR UPDATE OF profile,users`,[this.organizationId,agentId]);
      if(!target.rows[0])throw new BadRequestException('Select an active team member with the agent role');
      if(target.rows[0].status==='offline')throw new BadRequestException('This agent is offline and cannot receive assignments');
      if(lead.assigned_to===agentId)return {id:leadId,status:lead.status,assignedTo:agentId,unchanged:true};
      const load=await client.query<{count:number}>(`SELECT count(*)::int AS count FROM lead_assignments WHERE organization_id=$1 AND agent_id=$2 AND unassigned_at IS NULL`,[this.organizationId,agentId]);
      if((load.rows[0]?.count??0)>=target.rows[0].max_active_leads)throw new ConflictException('The selected agent has reached active lead capacity');
      await client.query(`UPDATE lead_assignments SET unassigned_at=now(),unassigned_by=$3 WHERE organization_id=$1 AND lead_id=$2 AND unassigned_at IS NULL`,[this.organizationId,leadId,actor.id]);
      await client.query(`INSERT INTO lead_assignments (organization_id,lead_id,agent_id,assigned_by,reason) VALUES ($1,$2,$3,$4,$5)`,[this.organizationId,leadId,agentId,actor.id,reason]);
      await client.query(`UPDATE leads SET assigned_to=$1,status='assigned',updated_at=now() WHERE id=$2 AND organization_id=$3`,[agentId,leadId,this.organizationId]);
      if(lead.status!=='assigned'){
        assertLeadTransition(lead.status,'assigned');
        await client.query(`INSERT INTO lead_stage_transitions (organization_id,lead_id,from_status,to_status,reason,actor_id) VALUES ($1,$2,$3,'assigned',$4,$5)`,[this.organizationId,leadId,lead.status,reason,actor.id]);
      }
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'lead.assigned','lead',$3,$4::jsonb)`,[this.organizationId,actor.id,leadId,JSON.stringify({agentId,previousAssignee:lead.assigned_to,reason})]);
      await this.notifications.forUser(client,{organizationId:this.organizationId,userId:agentId,eventKey:`manual-assignment:${randomUUID()}`,eventType:'lead.assigned',title:'Lead assigned to you',body:'A lead was assigned to your portfolio.',link:'/leads',entityType:'lead',entityId:leadId,preference:'assignment'});
      return {id:leadId,status:'assigned',assignedTo:agentId};
    });
  }

  async assignees(actor:AuthenticatedUser){
    if(!['admin','manager'].includes(actor.role))throw new ForbiddenException('Only admins and managers can view assignment options');
    const result=await this.database.query(`SELECT users.id,users.display_name AS "displayName",profile.status,profile.max_active_leads AS "maxActiveLeads",count(assignments.id)::int AS "activeLeads" FROM agent_profiles profile JOIN users ON users.id=profile.user_id AND users.organization_id=profile.organization_id AND users.active=true AND users.role='agent' LEFT JOIN lead_assignments assignments ON assignments.organization_id=profile.organization_id AND assignments.agent_id=profile.user_id AND assignments.unassigned_at IS NULL WHERE profile.organization_id=$1 GROUP BY users.id,profile.status,profile.max_active_leads ORDER BY users.display_name`,[this.organizationId]);
    return {data:result.rows};
  }

  private get organizationId() {
    const id = process.env.ORGANIZATION_ID;
    if (!id) throw new Error('ORGANIZATION_ID must be configured');
    return id;
  }

  private throwDuplicatePhone(error: unknown): never {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      throw new ConflictException('An active lead with this phone number already exists');
    }
    throw error;
  }
}
