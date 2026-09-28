export type LeadFactField = 'score' | 'budgetAmount' | 'intent' | 'timeline' | 'region' | 'propertyType' | 'source';
export type RuleOperator = 'equals' | 'notEquals' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'contains';
export interface RoutingCondition { field: LeadFactField; operator: RuleOperator; value: string | number; }
export interface RoutingRule { id: string; name: string; enabled: boolean; priority: number; conditions: readonly RoutingCondition[]; agentIds?: readonly string[]; }
export interface RoutingLead { id: string; score: number; budgetAmount?: number | null; intent: string; timeline?: string | null; region?: string | null; propertyType?: string | null; source?: string | null; }
export interface RoutingAgent { id: string; status: 'available' | 'busy' | 'offline'; specialty: readonly string[]; region?: string | null; regions?: readonly string[]; activeLeads: number; maxLeads: number; medianResponseMinutes: number; }
export interface RoutingDecision { outcome: 'assigned' | 'queued'; leadId: string; agentId?: string; matchedRuleId?: string; reason: string; eligibleAgentIds: string[]; }

function compare(actual: unknown, operator: RuleOperator, expected: string | number): boolean {
  if (actual === null || actual === undefined) return false;
  if (operator === 'equals') return String(actual).toLocaleLowerCase() === String(expected).toLocaleLowerCase();
  if (operator === 'notEquals') return String(actual).toLocaleLowerCase() !== String(expected).toLocaleLowerCase();
  if (operator === 'contains') return String(actual).toLocaleLowerCase().includes(String(expected).toLocaleLowerCase());
  const left = typeof actual === 'number' ? actual : Number(actual);
  const right = typeof expected === 'number' ? expected : Number(expected);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  if (operator === 'greaterThan') return left > right;
  if (operator === 'greaterThanOrEqual') return left >= right;
  if (operator === 'lessThan') return left < right;
  return left <= right;
}

function fact(lead: RoutingLead, field: LeadFactField): unknown { return lead[field]; }

function matches(lead: RoutingLead, rule: RoutingRule): boolean {
  return rule.conditions.length > 0 && rule.conditions.every((condition) => compare(fact(lead, condition.field), condition.operator, condition.value));
}

export function evaluateRouting(lead: RoutingLead, rules: readonly RoutingRule[], agents: readonly RoutingAgent[]): RoutingDecision {
  const orderedRules = rules.filter((rule) => rule.enabled).slice().sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  const matchedRule = orderedRules.find((rule) => matches(lead, rule));
  if (!matchedRule) return { outcome: 'queued', leadId: lead.id, reason: 'No enabled routing rule matched', eligibleAgentIds: [] };

  const eligible = agents.filter((agent) =>
    agent.status === 'available' && agent.maxLeads > 0 && agent.activeLeads < agent.maxLeads &&
    (!matchedRule.agentIds?.length || matchedRule.agentIds.includes(agent.id)) &&
    (!lead.region || !(agent.regions?.length) && !agent.region || (agent.regions?.length ? agent.regions.some((region) => region.toLocaleLowerCase() === lead.region?.toLocaleLowerCase()) : agent.region?.toLocaleLowerCase() === lead.region.toLocaleLowerCase())) &&
    (!lead.propertyType || agent.specialty.length === 0 || agent.specialty.some((value) => value.toLocaleLowerCase() === lead.propertyType?.toLocaleLowerCase())),
  );
  const eligibleAgentIds = eligible.map((agent) => agent.id).sort();
  if (!eligible.length) {
    return { outcome: 'queued', leadId: lead.id, matchedRuleId: matchedRule.id, reason: `Rule "${matchedRule.name}" matched but no eligible agent has capacity`, eligibleAgentIds };
  }

  const selected = [...eligible].sort((a, b) =>
    a.activeLeads / a.maxLeads - b.activeLeads / b.maxLeads ||
    a.medianResponseMinutes - b.medianResponseMinutes ||
    a.id.localeCompare(b.id),
  )[0];
  return {
    outcome: 'assigned', leadId: lead.id, agentId: selected.id, matchedRuleId: matchedRule.id,
    reason: `Rule "${matchedRule.name}" matched; selected the eligible agent with the lowest load ratio, then fastest median response`, eligibleAgentIds,
  };
}
