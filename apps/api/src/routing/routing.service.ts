import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.module';
import { AuthenticatedUser } from '../identity/auth.guard';
import { assertLeadTransition } from '../leads/lead-workflow';
import { evaluateRouting, RoutingAgent, RoutingLead, RoutingRule } from './routing-engine';
import { agentProfileSchema, routingRuleSetSchema, RoutingRuleSet } from './routing.schema';
import { NotificationService } from '../operations/notification.service';

@Injectable()
export class RoutingService {
  constructor(private readonly database: DatabaseService,private readonly notifications:NotificationService) {}

  async activeRuleSet() {
    const result = await this.database.query(`SELECT id,version,rules,activated_at AS "activatedAt" FROM routing_rule_set_versions WHERE organization_id=$1 AND state='active'`, [this.organizationId]);
    return result.rows[0] ?? null;
  }

  async versions(actor: AuthenticatedUser) {
    this.assertAdmin(actor);
    const result = await this.database.query(`SELECT id,version,state,rules,created_at AS "createdAt",activated_at AS "activatedAt" FROM routing_rule_set_versions WHERE organization_id=$1 ORDER BY version DESC`, [this.organizationId]);
    return { data: result.rows };
  }

  async getVersion(actor: AuthenticatedUser, ruleSetId: string) {
    this.assertAdmin(actor);
    const result = await this.database.query(`SELECT id,version,state,rules,created_at AS "createdAt",activated_at AS "activatedAt" FROM routing_rule_set_versions WHERE id=$1 AND organization_id=$2`, [ruleSetId, this.organizationId]);
    return result.rows[0] ?? null;
  }

  async agents(actor: AuthenticatedUser) {
    this.assertAdmin(actor);
    const result = await this.database.query(
      `SELECT users.id,users.display_name AS "displayName",users.email,profile.status,COALESCE(profile.specialties,'{}') AS specialties,COALESCE(profile.regions,'{}') AS regions,COALESCE(profile.max_active_leads,15) AS "maxActiveLeads",COALESCE(profile.median_response_minutes,999)::float8 AS "medianResponseMinutes",count(assignments.id)::int AS "activeLeads"
       FROM users LEFT JOIN agent_profiles profile ON profile.organization_id=users.organization_id AND profile.user_id=users.id
       LEFT JOIN lead_assignments assignments ON assignments.organization_id=users.organization_id AND assignments.agent_id=users.id AND assignments.unassigned_at IS NULL
       WHERE users.organization_id=$1 AND users.active=true AND users.role='agent'
       GROUP BY users.id,profile.status,profile.specialties,profile.regions,profile.max_active_leads,profile.median_response_minutes ORDER BY users.display_name`,
      [this.organizationId],
    );
    return { data: result.rows };
  }

  async createDraft(actor: AuthenticatedUser, rawRules: unknown) {
    this.assertAdmin(actor);
    const rules = this.parseRules(rawRules);
    return this.database.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`routing:${this.organizationId}`]);
      const current = await client.query<{ version: number }>(`SELECT COALESCE(MAX(version),0)::int AS version FROM routing_rule_set_versions WHERE organization_id=$1`, [this.organizationId]);
      const result = await client.query(
        `INSERT INTO routing_rule_set_versions (organization_id,version,state,rules,created_by) VALUES ($1,$2,'draft',$3::jsonb,$4) RETURNING id,version,state,rules,created_at AS "createdAt"`,
        [this.organizationId, current.rows[0].version + 1, JSON.stringify(rules), actor.id],
      );
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'routing.rules_draft_created','routing_rules',$3,$4::jsonb)`, [this.organizationId, actor.id, result.rows[0].id, JSON.stringify({ version: result.rows[0].version })]);
      return result.rows[0];
    });
  }

  async activate(actor: AuthenticatedUser, ruleSetId: string) {
    this.assertAdmin(actor);
    return this.database.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`routing:${this.organizationId}`]);
      const draft = await client.query(`SELECT id,version FROM routing_rule_set_versions WHERE id=$1 AND organization_id=$2 AND state='draft' FOR UPDATE`, [ruleSetId, this.organizationId]);
      if (!draft.rows[0]) return null;
      await client.query(`UPDATE routing_rule_set_versions SET state='retired' WHERE organization_id=$1 AND state='active'`, [this.organizationId]);
      const activated = await client.query(`UPDATE routing_rule_set_versions SET state='active',activated_at=now() WHERE id=$1 AND organization_id=$2 RETURNING id,version,rules,activated_at AS "activatedAt"`, [ruleSetId, this.organizationId]);
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'routing.rules_activated','routing_rules',$3,$4::jsonb)`, [this.organizationId, actor.id, ruleSetId, JSON.stringify({ version: draft.rows[0].version })]);
      return activated.rows[0];
    });
  }

  async updateAgentProfile(actor: AuthenticatedUser, userId: string, rawProfile: unknown) {
    this.assertAdmin(actor);
    const parsed = agentProfileSchema.safeParse(rawProfile);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`));
    return this.database.transaction(async (client) => {
      const member = await client.query(`SELECT id FROM users WHERE id=$1 AND organization_id=$2 AND active=true`, [userId, this.organizationId]);
      if (!member.rows[0]) return null;
      const profile = parsed.data;
      const result = await client.query(
        `INSERT INTO agent_profiles (organization_id,user_id,status,specialties,regions,max_active_leads,median_response_minutes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (organization_id,user_id) DO UPDATE SET status=EXCLUDED.status,specialties=EXCLUDED.specialties,regions=EXCLUDED.regions,max_active_leads=EXCLUDED.max_active_leads,median_response_minutes=EXCLUDED.median_response_minutes,updated_at=now()
         RETURNING organization_id,user_id AS "userId",status,specialties,regions,max_active_leads AS "maxActiveLeads",median_response_minutes AS "medianResponseMinutes"`,
        [this.organizationId, userId, profile.status, profile.specialties, profile.regions, profile.maxActiveLeads, profile.medianResponseMinutes],
      );
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'routing.agent_profile_updated','user',$3,$4::jsonb)`, [this.organizationId, actor.id, userId, JSON.stringify(profile)]);
      return result.rows[0];
    });
  }

  async preview(actor: AuthenticatedUser, leadId: string) {
    const lead = await this.getLead(actor, leadId);
    if (!lead) return null;
    const configuration = await this.activeRuleSet();
    if (!configuration) return { outcome: 'queued' as const, leadId, reason: 'No active routing rule set is configured', eligibleAgentIds: [], ruleSetVersion: null, preview: true };
    const agents = await this.getAgents();
    const decision = evaluateRouting(this.toRoutingLead(lead), this.rules(configuration.rules), agents);
    return { ...decision, ruleSetVersion: configuration.version, preview: true };
  }

  async route(actor: AuthenticatedUser, leadId: string) {
    this.assertAdmin(actor);
    return this.database.transaction(async (client) => {
      const leadResult = await client.query<{ id: string; score: number | null; budget_amount: string | null; source: string; intent: string | null; timeline: string | null; region: string | null; property_type: string | null; status: string; assigned_to: string | null }>(
        `SELECT id,score,budget_amount,source,intent,timeline,region,property_type,status,assigned_to FROM leads WHERE id=$1 AND organization_id=$2 AND archived_at IS NULL FOR UPDATE`,
        [leadId, this.organizationId],
      );
      const lead = leadResult.rows[0];
      if (!lead) return null;
      if (lead.status !== 'qualified' || lead.assigned_to) throw new BadRequestException('Only unassigned qualified leads can be routed');
      const active = await client.query<{ id: string; version: number; rules: unknown }>(`SELECT id,version,rules FROM routing_rule_set_versions WHERE organization_id=$1 AND state='active' FOR SHARE`, [this.organizationId]);
      if (!active.rows[0]) throw new BadRequestException('No active routing rule set is configured');
      await client.query(`SELECT user_id FROM agent_profiles WHERE organization_id=$1 AND status='available' ORDER BY user_id FOR UPDATE`, [this.organizationId]);
      const agents = await this.getAgents(client);
      const decision = evaluateRouting(this.toRoutingLead(lead), this.rules(active.rows[0].rules), agents);
      let selectedAgentId: string | null = null;
      if (decision.outcome === 'assigned' && decision.agentId) {
        assertLeadTransition('qualified', 'assigned');
        selectedAgentId = decision.agentId;
        await client.query(`INSERT INTO lead_assignments (organization_id,lead_id,agent_id,assigned_by,reason) VALUES ($1,$2,$3,$4,$5)`, [this.organizationId, leadId, selectedAgentId, actor.id, `automatic routing: ${decision.reason}`]);
        await client.query(`UPDATE leads SET assigned_to=$1,status='assigned',updated_at=now() WHERE id=$2 AND organization_id=$3`, [selectedAgentId, leadId, this.organizationId]);
        await client.query(`INSERT INTO lead_stage_transitions (organization_id,lead_id,from_status,to_status,reason,actor_id) VALUES ($1,$2,'qualified','assigned',$3,$4)`, [this.organizationId, leadId, decision.reason, actor.id]);
      }
      const stored = await client.query(
        `INSERT INTO routing_decisions (organization_id,lead_id,rule_set_version_id,outcome,matched_rule_id,eligible_agent_ids,selected_agent_id,explanation)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,outcome,matched_rule_id AS "matchedRuleId",eligible_agent_ids AS "eligibleAgentIds",selected_agent_id AS "selectedAgentId",explanation,created_at AS "createdAt"`,
        [this.organizationId, leadId, active.rows[0].id, decision.outcome, decision.matchedRuleId ?? null, decision.eligibleAgentIds, selectedAgentId, decision.reason],
      );
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'lead.routing_decided','lead',$3,$4::jsonb)`, [this.organizationId, actor.id, leadId, JSON.stringify({ outcome: decision.outcome, ruleSetVersion: active.rows[0].version, decisionId: stored.rows[0].id, selectedAgentId })]);
      if(selectedAgentId){
        await this.notifications.forUser(client,{organizationId:this.organizationId,userId:selectedAgentId,eventKey:`routing-assignment:${stored.rows[0].id}`,eventType:'lead.assigned',title:'Lead assigned to you',body:'A qualified lead was assigned to your portfolio.',link:'/leads',entityType:'lead',entityId:leadId,preference:'assignment'});
      }
      return { ...stored.rows[0], ruleSetVersion: active.rows[0].version, status: selectedAgentId ? 'assigned' : 'qualified' };
    });
  }

  private async getLead(actor: AuthenticatedUser, leadId: string) {
    const result = await this.database.query<{ id: string; score: number | null; budget_amount: string | null; source: string; intent: string | null; timeline: string | null; region: string | null; property_type: string | null }>(
      `SELECT id,score,budget_amount,source,intent,timeline,region,property_type FROM leads WHERE id=$1 AND organization_id=$2 AND archived_at IS NULL AND ($3 IN ('admin','manager') OR assigned_to=$4::uuid OR created_by=$5)`,
      [leadId, this.organizationId, actor.role, actor.id, actor.id],
    );
    return result.rows[0] ?? null;
  }

  private async getAgents(client?: import('pg').PoolClient): Promise<RoutingAgent[]> {
    const query = `SELECT profile.user_id AS id,profile.status,profile.specialties AS specialty,profile.regions,profile.max_active_leads AS "maxLeads",profile.median_response_minutes::float8 AS "medianResponseMinutes",count(assignments.id)::int AS "activeLeads"
      FROM agent_profiles profile JOIN users ON users.id=profile.user_id AND users.organization_id=profile.organization_id AND users.active=true AND users.role='agent'
      LEFT JOIN lead_assignments assignments ON assignments.organization_id=profile.organization_id AND assignments.agent_id=profile.user_id AND assignments.unassigned_at IS NULL
      WHERE profile.organization_id=$1 GROUP BY profile.user_id,profile.status,profile.specialties,profile.regions,profile.max_active_leads,profile.median_response_minutes ORDER BY profile.user_id`;
    const result = client ? await client.query(query, [this.organizationId]) : await this.database.query(query, [this.organizationId]);
    return result.rows as RoutingAgent[];
  }

  private toRoutingLead(lead: { id: string; score: number | null; budget_amount: string | null; source: string; intent?: string | null; timeline?: string | null; region?: string | null; property_type?: string | null }): RoutingLead {
    return { id: lead.id, score: lead.score ?? 0, budgetAmount: lead.budget_amount === null ? null : Number(lead.budget_amount), intent: lead.intent ?? 'unknown', timeline: lead.timeline, region: lead.region, propertyType: lead.property_type, source: lead.source };
  }

  private rules(value: unknown): readonly RoutingRule[] {
    const parsed = this.parseRules(value);
    return parsed.rules as RoutingRule[];
  }

  private parseRules(value: unknown): RoutingRuleSet {
    const parsed = routingRuleSetSchema.safeParse(value);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`));
    return parsed.data;
  }

  private assertAdmin(actor: AuthenticatedUser) {
    if (!['admin', 'manager'].includes(actor.role)) throw new ForbiddenException('Only admins and managers can change routing settings');
  }

  private get organizationId() {
    const id = process.env.ORGANIZATION_ID;
    if (!id) throw new Error('ORGANIZATION_ID must be configured');
    return id;
  }
}
