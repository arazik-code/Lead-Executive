import { z } from 'zod';

const conditionSchema = z.object({
  field: z.enum(['score', 'budgetAmount', 'intent', 'timeline', 'region', 'propertyType', 'source']),
  operator: z.enum(['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'contains']),
  value: z.union([z.string().min(1).max(120), z.number().finite()]),
}).strict().superRefine((condition, context) => {
  const numericField = condition.field === 'score' || condition.field === 'budgetAmount';
  const numericOperator = ['greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'].includes(condition.operator);
  if (numericField !== (typeof condition.value === 'number') || (numericOperator && typeof condition.value !== 'number')) {
    context.addIssue({ code: 'custom', path: ['value'], message: 'Condition value must match its field and operator' });
  }
  if (condition.field === 'score' && typeof condition.value === 'number' && (condition.value < 0 || condition.value > 100)) {
    context.addIssue({ code: 'custom', path: ['value'], message: 'Score values must be between 0 and 100' });
  }
  if (condition.field === 'budgetAmount' && typeof condition.value === 'number' && condition.value < 0) {
    context.addIssue({ code: 'custom', path: ['value'], message: 'Budget values cannot be negative' });
  }
});

export const routingRuleSetSchema = z.object({
  rules: z.array(z.object({
    id: z.string().min(1).max(100),
    name: z.string().min(1).max(160),
    enabled: z.boolean(),
    priority: z.number().int().min(0).max(10000),
    conditions: z.array(conditionSchema).min(1).max(20),
    agentIds: z.array(z.string().uuid()).max(100).optional(),
  }).strict()).min(1).max(100),
}).strict().superRefine((ruleSet, context) => {
  const ids = ruleSet.rules.map((rule) => rule.id);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: 'custom', path: ['rules'], message: 'Routing rule IDs must be unique' });
  if (!ruleSet.rules.some((rule) => rule.enabled)) context.addIssue({ code: 'custom', path: ['rules'], message: 'At least one rule must be enabled' });
});

export const agentProfileSchema = z.object({
  status: z.enum(['available', 'busy', 'offline']),
  specialties: z.array(z.string().trim().min(1).max(80)).max(50),
  regions: z.array(z.string().trim().min(1).max(80)).max(50),
  maxActiveLeads: z.number().int().min(1).max(1000),
  medianResponseMinutes: z.number().finite().min(0).max(100000),
}).strict();

export type RoutingRuleSet = z.infer<typeof routingRuleSetSchema>;
