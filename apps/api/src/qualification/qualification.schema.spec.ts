import assert from 'node:assert/strict';
import test from 'node:test';
import { qualificationAnswersSchema, qualificationFormSchema } from './qualification.schema';

const form = {
  questions: [{ id: 'budget', label: 'Budget readiness', answerType: 'single', enabled: true, required: true, weight: 60, pointsByOption: { high: 100, low: 10 } }],
  thresholds: { mediumMinimum: 50, highMinimum: 80 },
};

test('accepts valid versioned form configuration', () => {
  assert.equal(qualificationFormSchema.parse(form).questions[0].id, 'budget');
});

test('rejects overlapping score bands, duplicate question IDs, and all-disabled forms', () => {
  assert.equal(qualificationFormSchema.safeParse({ ...form, thresholds: { mediumMinimum: 80, highMinimum: 80 } }).success, false);
  assert.equal(qualificationFormSchema.safeParse({ ...form, questions: [form.questions[0], form.questions[0]] }).success, false);
  assert.equal(qualificationFormSchema.safeParse({ ...form, questions: [{ ...form.questions[0], enabled: false }] }).success, false);
});

test('rejects malformed and out-of-range score mappings', () => {
  assert.equal(qualificationFormSchema.safeParse({ ...form, questions: [{ ...form.questions[0], pointsByOption: { high: 101 } }] }).success, false);
  assert.equal(qualificationFormSchema.safeParse({ ...form, extra: true }).success, false);
});

test('accepts typed answers and rejects non-finite score inputs', () => {
  assert.equal(qualificationAnswersSchema.safeParse({ budget: 'high', areas: ['north', 'west'], years: 3 }).success, true);
  assert.equal(qualificationAnswersSchema.safeParse({ years: Number.NaN }).success, false);
});
