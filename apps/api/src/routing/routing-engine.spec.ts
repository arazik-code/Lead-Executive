import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateRouting, RoutingAgent, RoutingRule } from './routing-engine';

const rules: RoutingRule[] = [
  { id: '10', name: 'Hot investor', enabled: true, priority: 2, conditions: [{ field: 'score', operator: 'greaterThanOrEqual', value: 80 }] },
  { id: '2', name: 'Marina', enabled: true, priority: 1, conditions: [{ field: 'region', operator: 'equals', value: 'Dubai Marina' }] },
  { id: '3', name: 'Disabled', enabled: false, priority: 0, conditions: [] },
];
const lead = { id: 'lead-1', score: 90, intent: 'High', region: 'Dubai Marina', propertyType: 'Villa' };
const agents: RoutingAgent[] = [
  { id: 'full', status: 'available', specialty: ['Villa'], region: 'Dubai Marina', activeLeads: 5, maxLeads: 5, medianResponseMinutes: 1 },
  { id: 'busy', status: 'busy', specialty: ['Villa'], region: 'Dubai Marina', activeLeads: 1, maxLeads: 10, medianResponseMinutes: 1 },
  { id: 'balanced-slow', status: 'available', specialty: ['Villa'], region: 'Dubai Marina', activeLeads: 4, maxLeads: 10, medianResponseMinutes: 8 },
  { id: 'balanced-fast', status: 'available', specialty: ['Villa'], region: 'Dubai Marina', activeLeads: 4, maxLeads: 10, medianResponseMinutes: 3 },
];

test('uses lowest priority number and returns an auditable capacity-aware assignment', () => {
  const decision = evaluateRouting(lead, rules, agents);
  assert.equal(decision.outcome, 'assigned');
  assert.equal(decision.matchedRuleId, '2');
  assert.equal(decision.agentId, 'balanced-fast');
  assert.deepEqual(decision.eligibleAgentIds, ['balanced-fast', 'balanced-slow']);
  assert.match(decision.reason, /lowest load ratio/);
});

test('queues when no rule matches or no matching agent has capacity', () => {
  assert.equal(evaluateRouting({ ...lead, region: 'Abu Dhabi', score: 20 }, rules, agents).outcome, 'queued');
  const noCapacity = evaluateRouting(lead, rules, agents.map((agent) => ({ ...agent, status: 'offline' as const })));
  assert.equal(noCapacity.outcome, 'queued');
  assert.match(noCapacity.reason, /no eligible agent has capacity/);
});

test('does not allow stale, disabled, or empty-condition rules to route a lead', () => {
  const decision = evaluateRouting(lead, [{ ...rules[2], conditions: [] }], agents);
  assert.equal(decision.outcome, 'queued');
  assert.equal(decision.matchedRuleId, undefined);
});

test('matches an agent against any configured service region', () => {
  const regionRule: RoutingRule[] = [{ id: 'region', name: 'Dubai', enabled: true, priority: 1, conditions: [{ field: 'region', operator: 'equals', value: 'Dubai Marina' }] }];
  const regionAgents: RoutingAgent[] = [{ id: 'multi-region', status: 'available', specialty: ['Villa'], regions: ['Dubai Marina', 'Abu Dhabi'], activeLeads: 0, maxLeads: 4, medianResponseMinutes: 5 }];
  assert.equal(evaluateRouting(lead, regionRule, regionAgents).agentId, 'multi-region');
});
