import 'dotenv/config';
import { Pool, PoolClient } from 'pg';
import { calculateQualificationScore } from '../qualification/scoring';
import { QualificationForm } from '../qualification/qualification.schema';

const organizationId = process.env.ORGANIZATION_ID;
const adminId = '00000000-0000-4000-8000-000000000002';
const managerId = '00000000-0000-4000-8000-000000000003';
const agentIds = ['00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000005'];
const formId = '30000000-0000-4000-8000-000000000001';
const routeVersionId = '30000000-0000-4000-8000-000000000002';
const leadIds = Array.from({ length: 9 }, (_, index) => `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
const conversationIds = Array.from({ length: 3 }, (_, index) => `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);

const form: QualificationForm = {
  questions: [
    { id: 'purchase_intent', label: 'What best describes your property plans?', answerType: 'single', enabled: true, required: true, weight: 35, pointsByOption: { investment: 85, end_use: 100, exploring: 35 } },
    { id: 'budget_readiness', label: 'How clear is your budget?', answerType: 'single', enabled: true, required: true, weight: 35, pointsByOption: { approved: 100, defined: 75, flexible: 45, unknown: 20 } },
    { id: 'purchase_timing', label: 'When are you looking to move?', answerType: 'single', enabled: true, required: true, weight: 30, pointsByOption: { immediate: 100, quarter: 80, half_year: 55, researching: 25 } },
  ],
  thresholds: { mediumMinimum: 45, highMinimum: 76 },
};
const routingRules = { rules: [
  { id: 'prime_intent', name: 'Prime intent · prompt follow-up', enabled: true, priority: 1, conditions: [{ field: 'score', operator: 'greaterThanOrEqual', value: 82 }], agentIds },
  { id: 'investment_focus', name: 'Investment enquiries', enabled: true, priority: 2, conditions: [{ field: 'intent', operator: 'equals', value: 'investment' }], agentIds },
  { id: 'qualified_fallback', name: 'Qualified lead review', enabled: true, priority: 10, conditions: [{ field: 'score', operator: 'greaterThanOrEqual', value: 50 }], agentIds },
] };
const leads = [
  { name: 'Amira Al Mansoori', phone: '+971501110101', email: 'amira.demo@example.invalid', status: 'new', score: null, source: 'Demo seed · Website', intent: 'end use', timeline: '3 months', region: 'Dubai Marina', property: 'Apartment', budget: 2400000, agent: null, days: 0 },
  { name: 'Omar Rahman', phone: '+971501110102', email: 'omar.demo@example.invalid', status: 'qualifying', score: 61, source: 'Demo seed · Referral', intent: 'investment', timeline: '6 months', region: 'Downtown Dubai', property: 'Apartment', budget: 1800000, agent: null, days: 1 },
  { name: 'Leila Haddad', phone: '+971501110103', email: 'leila.demo@example.invalid', status: 'qualified', score: 88, source: 'Demo seed · Property portal', intent: 'end use', timeline: 'immediate', region: 'Palm Jumeirah', property: 'Villa', budget: 8200000, agent: null, days: 2 },
  { name: 'Yusuf Khan', phone: '+971501110104', email: 'yusuf.demo@example.invalid', status: 'assigned', score: 84, source: 'Demo seed · WhatsApp', intent: 'investment', timeline: 'quarter', region: 'Business Bay', property: 'Apartment', budget: 2100000, agent: agentIds[0], days: 3 },
  { name: 'Nadia Saleh', phone: '+971501110105', email: 'nadia.demo@example.invalid', status: 'contacted', score: 72, source: 'Demo seed · Referral', intent: 'end use', timeline: 'half year', region: 'Jumeirah Village Circle', property: 'Townhouse', budget: 2900000, agent: agentIds[1], days: 5 },
  { name: 'Karim Nasser', phone: '+971501110106', email: 'karim.demo@example.invalid', status: 'meeting_scheduled', score: 93, source: 'Demo seed · Website', intent: 'investment', timeline: 'immediate', region: 'Dubai Creek Harbour', property: 'Apartment', budget: 3600000, agent: agentIds[0], days: 7 },
  { name: 'Sana Qureshi', phone: '+971501110107', email: 'sana.demo@example.invalid', status: 'nurture', score: 44, source: 'Demo seed · Campaign', intent: 'exploring', timeline: 'researching', region: 'Dubai Hills', property: 'Villa', budget: 5100000, agent: null, days: 9 },
  { name: 'Zaid Farouk', phone: '+971501110108', email: 'zaid.demo@example.invalid', status: 'won', score: 97, source: 'Demo seed · Referral', intent: 'end use', timeline: 'immediate', region: 'City Walk', property: 'Apartment', budget: 4200000, agent: agentIds[1], days: 12 },
  { name: 'Maya Ibrahim', phone: '+971501110109', email: 'maya.demo@example.invalid', status: 'lost', score: 36, source: 'Demo seed · Property portal', intent: 'exploring', timeline: 'researching', region: 'Dubai Marina', property: 'Apartment', budget: 1300000, agent: null, days: 18 },
];

async function seed(client: PoolClient) {
  if (process.env.DEMO_SEED !== '1' || process.env.AUTH_MODE !== 'development' || process.env.NODE_ENV === 'production') {
    throw new Error('Demo data seeding requires DEMO_SEED=1, AUTH_MODE=development, and NODE_ENV other than production.');
  }
  if (!organizationId || !process.env.DATABASE_URL) throw new Error('ORGANIZATION_ID and DATABASE_URL must be configured.');
  if (process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_PHONE_NUMBER_ID) throw new Error('Disable WhatsApp provider credentials before seeding demo contacts. The seed is designed for a local, provider-disconnected demo.');
  await client.query('BEGIN');
  try {
    await client.query(`INSERT INTO organizations(id,name) VALUES ($1,'Executive Lead Control Demo') ON CONFLICT (id) DO NOTHING`, [organizationId]);
    await client.query(`INSERT INTO users(id,organization_id,auth_subject,email,display_name,role,active) VALUES ($1,$2,'local-admin','local-admin@development.invalid','Demo Workspace Admin','admin',true) ON CONFLICT (auth_subject) DO UPDATE SET organization_id=EXCLUDED.organization_id,active=true`, [adminId, organizationId]);
    await client.query(`INSERT INTO users(id,organization_id,auth_subject,email,display_name,role,active) VALUES ($1,$2,NULL,'manager@demo.invalid','Jordan Bennett','manager',true),($3,$2,NULL,'alex.morgan@demo.invalid','Alex Morgan','agent',true),($4,$2,NULL,'samira.hassan@demo.invalid','Samira Hassan','agent',true) ON CONFLICT (id) DO UPDATE SET active=true,display_name=EXCLUDED.display_name,role=EXCLUDED.role`, [managerId, organizationId, ...agentIds]);
    await client.query(`INSERT INTO agent_profiles(organization_id,user_id,status,specialties,regions,max_active_leads,median_response_minutes) VALUES ($1,$2,'available',ARRAY['residential','investment'],ARRAY['Dubai Marina','Downtown Dubai','Business Bay'],12,14),($1,$3,'busy',ARRAY['residential','family homes'],ARRAY['Jumeirah Village Circle','City Walk','Dubai Hills'],10,22) ON CONFLICT (organization_id,user_id) DO UPDATE SET status=EXCLUDED.status,specialties=EXCLUDED.specialties,regions=EXCLUDED.regions,max_active_leads=EXCLUDED.max_active_leads,median_response_minutes=EXCLUDED.median_response_minutes`, [organizationId, ...agentIds]);
    await client.query(`INSERT INTO organization_app_settings(organization_id,default_currency,updated_by) VALUES ($1,'AED','demo-seed') ON CONFLICT (organization_id) DO NOTHING`, [organizationId]);

    await client.query(`INSERT INTO qualification_form_versions(id,organization_id,version,state,form,created_by,published_at) VALUES ($1,$2,1,'published',$3::jsonb,$4,now()) ON CONFLICT (id) DO NOTHING`, [formId, organizationId, JSON.stringify(form), adminId]);
    await client.query(`INSERT INTO routing_rule_set_versions(id,organization_id,version,state,rules,created_by,activated_at) VALUES ($1,$2,1,'active',$3::jsonb,$4,now()) ON CONFLICT (id) DO NOTHING`, [routeVersionId, organizationId, JSON.stringify(routingRules), adminId]);

    await client.query(`DELETE FROM qualification_score_snapshots WHERE organization_id=$1 AND lead_id=ANY($2::uuid[])`, [organizationId, leadIds]);
    await client.query(`DELETE FROM routing_decisions WHERE organization_id=$1 AND lead_id=ANY($2::uuid[])`, [organizationId, leadIds]);
    await client.query(`DELETE FROM audit_events WHERE organization_id=$1 AND entity_id=ANY($2::uuid[]) AND payload->>'demo'='true'`, [organizationId, leadIds]);
    await client.query(`DELETE FROM user_notifications WHERE organization_id=$1 AND event_key LIKE 'demo:%'`, [organizationId]);
    const statusPaths: Record<string, string[]> = {
      new: ['new'], qualifying: ['new', 'qualifying'], qualified: ['new', 'qualifying', 'qualified'],
      assigned: ['new', 'qualifying', 'qualified', 'assigned'], contacted: ['new', 'qualifying', 'qualified', 'assigned', 'contacted'],
      meeting_scheduled: ['new', 'qualifying', 'qualified', 'assigned', 'contacted', 'meeting_scheduled'],
      nurture: ['new', 'qualifying', 'nurture'], won: ['new', 'qualifying', 'qualified', 'assigned', 'contacted', 'meeting_scheduled', 'won'],
      lost: ['new', 'qualifying', 'qualified', 'assigned', 'contacted', 'lost'],
    };
    for (let index = 0; index < leads.length; index += 1) {
      const lead = leads[index];
      const id = leadIds[index];
      const createdAt = new Date(Date.now() - lead.days * 86400000).toISOString();
      const answers = { purchase_intent: lead.intent.replaceAll(' ', '_'), budget_readiness: lead.score === null ? null : lead.score >= 80 ? 'approved' : lead.score >= 60 ? 'defined' : 'flexible', purchase_timing: lead.timeline === 'immediate' ? 'immediate' : lead.timeline === 'quarter' ? 'quarter' : lead.timeline === 'half year' ? 'half_year' : 'researching' };
      const score = lead.score === null ? null : calculateQualificationScore(form.questions, answers).score;
      await client.query(`INSERT INTO leads(id,organization_id,name,phone,email,budget_amount,budget_currency,status,source,created_by,created_at,updated_at,score,score_updated_at,intent,timeline,region,property_type) VALUES ($1,$2,$3,$4,$5,$6,'AED',$7,$8,$9,$10,$10,$11,CASE WHEN $11 IS NULL THEN NULL ELSE $10 END,$12,$13,$14,$15) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,phone=EXCLUDED.phone,email=EXCLUDED.email,budget_amount=EXCLUDED.budget_amount,budget_currency=EXCLUDED.budget_currency,status=EXCLUDED.status,source=EXCLUDED.source,score=EXCLUDED.score,intent=EXCLUDED.intent,timeline=EXCLUDED.timeline,region=EXCLUDED.region,property_type=EXCLUDED.property_type,archived_at=NULL`, [id, organizationId, lead.name, lead.phone, lead.email, lead.budget, lead.status, lead.source, adminId, createdAt, score, lead.intent, lead.timeline, lead.region, lead.property]);
      await client.query(`DELETE FROM lead_stage_transitions WHERE organization_id=$1 AND lead_id=$2`, [organizationId, id]);
      const path = statusPaths[lead.status];
      for (let step = 0; step < path.length; step += 1) {
        await client.query(`INSERT INTO lead_stage_transitions(organization_id,lead_id,from_status,to_status,reason,actor_id,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [organizationId, id, step ? path[step - 1] : null, path[step], 'Demo scenario · realistic pipeline history', adminId, new Date(Date.parse(createdAt) + step * 3600000).toISOString()]);
      }
      await client.query(`INSERT INTO audit_events(organization_id,actor_id,event_type,entity_type,entity_id,payload,created_at) VALUES ($1,$2,'lead.created','lead',$3,$4::jsonb,$5) ON CONFLICT DO NOTHING`, [organizationId, adminId, id, JSON.stringify({ name: lead.name, source: lead.source, demo: true }), createdAt]);
      if (lead.agent) {
        await client.query(`UPDATE leads SET assigned_to=$1 WHERE id=$2 AND organization_id=$3`, [lead.agent, id, organizationId]);
        await client.query(`INSERT INTO lead_assignments(organization_id,lead_id,agent_id,assigned_by,reason,assigned_at) VALUES ($1,$2,$3,$4,'Demo scenario · capacity-aware assignment',$5) ON CONFLICT DO NOTHING`, [organizationId, id, lead.agent, adminId, createdAt]);
      }
      if (score !== null) {
        await client.query(`INSERT INTO lead_answers(organization_id,lead_id,form_version_id,attempt,answers,submitted_by,response_json) VALUES ($1,$2,$3,1,$4::jsonb,$5,$4::jsonb) ON CONFLICT (organization_id,lead_id,form_version_id,attempt) DO NOTHING`, [organizationId, id, formId, JSON.stringify(answers), adminId]);
        const scoreDetail = calculateQualificationScore(form.questions, answers);
        await client.query(`INSERT INTO qualification_score_snapshots(organization_id,lead_id,form_version_id,score,completion_rate,scoring_version,breakdown,calculated_at) VALUES ($1,$2,$3,$4,$5,1,$6::jsonb,$7) ON CONFLICT DO NOTHING`, [organizationId, id, formId, scoreDetail.score, scoreDetail.completionRate, JSON.stringify(scoreDetail), createdAt]);
      }
    }
    await client.query(`INSERT INTO routing_decisions(organization_id,lead_id,rule_set_version_id,outcome,matched_rule_id,eligible_agent_ids,selected_agent_id,explanation) VALUES ($1,$2,$3,'assigned','prime_intent',$4::uuid[],$5,'Demo decision · high-intent fit, available agent, and capacity confirmed') ON CONFLICT DO NOTHING`, [organizationId, leadIds[3], routeVersionId, agentIds, agentIds[0]]);

    const conversations = [
      { name: 'Leila Haddad', phone: '+971501110103', lead: leadIds[2], agent: agentIds[0], unread: 2, messages: [['inbound', 'Hi, I’m comparing a few waterfront homes. Could someone share the latest options?'], ['outbound', 'Absolutely, Leila. I’ll curate a short list around your brief.'], ['inbound', 'That would be great. I can view this weekend.']] },
      { name: 'Yusuf Khan', phone: '+971501110104', lead: leadIds[3], agent: agentIds[0], unread: 0, messages: [['inbound', 'I’m looking at Business Bay as an investment.'], ['outbound', 'Understood. I can send options with rental yield context.']] },
      { name: 'Karim Nasser', phone: '+971501110106', lead: leadIds[5], agent: agentIds[1], unread: 1, messages: [['inbound', 'Can we move our viewing to Thursday afternoon?'], ['outbound', 'Thursday afternoon is available. I’ll confirm the time shortly.']] },
    ];
    for (let index = 0; index < conversations.length; index += 1) {
      const conversation = conversations[index];
      const createdAt = new Date(Date.now() - (index + 1) * 3600000).toISOString();
      await client.query(`INSERT INTO conversations(id,organization_id,phone,display_name,lead_id,assigned_to,status,consent_status,consent_source,consent_recorded_at,last_inbound_at,unread_count,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,'open','unknown',NULL,NULL,$7,$8,$7,$7) ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name,assigned_to=EXCLUDED.assigned_to,status='open',consent_status='unknown',consent_source=NULL,consent_recorded_at=NULL,unread_count=EXCLUDED.unread_count,updated_at=EXCLUDED.updated_at`, [conversationIds[index], organizationId, conversation.phone, conversation.name, conversation.lead, conversation.agent, createdAt, conversation.unread]);
      await client.query(`DELETE FROM conversation_messages WHERE organization_id=$1 AND conversation_id=$2`, [organizationId, conversationIds[index]]);
      for (let messageIndex = 0; messageIndex < conversation.messages.length; messageIndex += 1) {
        const [direction, content] = conversation.messages[messageIndex];
        await client.query(`INSERT INTO conversation_messages(id,organization_id,conversation_id,provider_message_id,direction,status,message_type,content,payload,actor_id,created_at,sent_at,delivered_at) VALUES ($1,$2,$3,$4,$5,'delivered','text',$6,'{"demo":true}'::jsonb,$7,$8,$8,$8)`, [`40000000-0000-4000-8000-${String(index * 10 + messageIndex + 1).padStart(12, '0')}`, organizationId, conversationIds[index], `demo-message-${index + 1}-${messageIndex + 1}`, direction, content, direction === 'outbound' ? adminId : null, new Date(Date.parse(createdAt) + messageIndex * 600000).toISOString()]);
      }
      await client.query(`DELETE FROM conversation_assignment_history WHERE organization_id=$1 AND conversation_id=$2`, [organizationId, conversationIds[index]]);
      await client.query(`INSERT INTO conversation_assignment_history(organization_id,conversation_id,previous_assignee,assigned_to,assigned_by,reason,assigned_at) SELECT $1,$2,NULL,$3,$4,'Demo scenario · initial inbox owner',$5 WHERE NOT EXISTS (SELECT 1 FROM conversation_assignment_history WHERE organization_id=$1 AND conversation_id=$2)`, [organizationId, conversationIds[index], conversation.agent, adminId, createdAt]);
    }

    await client.query(`INSERT INTO user_notifications(organization_id,user_id,event_key,event_type,title,body,link,entity_type,entity_id) VALUES ($1,$2,'demo:lead:new','lead.created','New inquiry received','Amira Al Mansoori submitted a website inquiry.','/leads?q=Amira','lead',$3),($1,$2,'demo:whatsapp:reply','whatsapp.inbound_message','A reply is waiting','Leila Haddad replied in the WhatsApp inbox.',$4,'conversation',$5) ON CONFLICT (organization_id,user_id,event_key) DO NOTHING`, [organizationId, adminId, leadIds[0], `/messages?conversation=${conversationIds[0]}`, conversationIds[0]]);
    await client.query('COMMIT');
    console.log(`Demo seed complete: ${leads.length} leads, 3 WhatsApp conversations, 4 team users, active qualification and routing examples. Synthetic contacts and messages only; no provider call was made.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try { const client = await pool.connect(); try { await seed(client); } finally { client.release(); } }
  finally { await pool.end(); }
}

void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
