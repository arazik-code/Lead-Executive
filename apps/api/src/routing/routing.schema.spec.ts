import assert from 'node:assert/strict';
import test from 'node:test';
import { agentProfileSchema, routingRuleSetSchema } from './routing.schema';

const rules = { rules: [{ id: 'high-budget', name: 'High budget', enabled: true, priority: 1, conditions: [{ field: 'budgetAmount', operator: 'greaterThanOrEqual', value: 500000 }], agentIds: [] }] };

test('accepts valid capacity-aware routing configuration', () => {
  assert.equal(routingRuleSetSchema.parse(rules).rules.length, 1);
  assert.equal(agentProfileSchema.parse({ status: 'available', specialties: ['residential'], regions: ['Dubai'], maxActiveLeads: 12, medianResponseMinutes: 20 }).status, 'available');
});

test('rejects invalid rule values and unsafe empty rules', () => {
  assert.equal(routingRuleSetSchema.safeParse({ rules: [] }).success, false);
  assert.equal(routingRuleSetSchema.safeParse({ rules: [{ ...rules.rules[0], conditions: [{ field: 'score', operator: 'greaterThan', value: 'high' }] }] }).success, false);
  assert.equal(routingRuleSetSchema.safeParse({ rules: [{ ...rules.rules[0], conditions: [{ field: 'budgetAmount', operator: 'greaterThan', value: -1 }] }] }).success, false);
});

test('rejects invalid agent capacity and specialties', () => {
  assert.equal(agentProfileSchema.safeParse({ status: 'available', specialties: [], regions: [], maxActiveLeads: 0, medianResponseMinutes: 0 }).success, false);
});
