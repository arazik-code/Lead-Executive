import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateQualificationScore, classifyScore, ScoringQuestion } from './scoring';

const questions: ScoringQuestion[] = [
  { id: 'budget', enabled: true, required: true, weight: 60, pointsByOption: { qualified: 100, low: 20 } },
  { id: 'timeline', enabled: true, required: true, weight: 40, pointsByOption: { immediate: 100, later: 50 } },
  { id: 'notes', enabled: true, required: false, weight: 10, pointsByOption: { supplied: 100 } },
  { id: 'disabled', enabled: false, required: true, weight: 50, pointsByOption: { yes: 100 } },
];

test('produces normalized, explainable weighted score and excludes blank optional questions', () => {
  const result = calculateQualificationScore(questions, { budget: 'qualified', timeline: 'later' });
  assert.equal(result.score, 80);
  assert.equal(result.answeredCount, 2);
  assert.equal(result.enabledCount, 3);
  assert.equal(result.completionRate, 67);
  assert.equal(result.components.find((item) => item.questionId === 'notes')?.weightedPoints, 0);
});

test('required unanswered questions reduce score while optional answered questions contribute', () => {
  const result = calculateQualificationScore(questions, { budget: 'qualified', notes: 'supplied' });
  assert.equal(result.score, 64);
  assert.equal(result.completionRate, 67);
});

test('multiple choice answers cannot inflate score by selecting every option', () => {
  const result = calculateQualificationScore([{ id: 'areas', enabled: true, required: true, weight: 100, pointsByOption: { fit: 100, nofit: 0 } }], { areas: ['fit', 'nofit'] });
  assert.equal(result.score, 50);
});

test('required text answers count toward completion without pretending to have a numeric score', () => {
  const result = calculateQualificationScore([{ id: 'notes', enabled: true, required: true, weight: 100, pointsByOption: null }], { notes: 'Looking near Downtown' });
  assert.equal(result.score, 0);
  assert.equal(result.completionRate, 100);
  assert.equal(result.components[0].answered, true);
  assert.equal(result.components[0].points, null);
});

test('rejects invalid weight and unknown answer values', () => {
  assert.throws(() => calculateQualificationScore([{ ...questions[0], weight: 0 }], {}), /weights must be positive/);
  assert.throws(() => calculateQualificationScore([questions[0]], { budget: 'unknown' }), /no valid score mapping/);
});

test('classifies exact thresholds without gaps or overlap', () => {
  assert.equal(classifyScore(49, 50, 80), 'low');
  assert.equal(classifyScore(50, 50, 80), 'medium');
  assert.equal(classifyScore(79, 50, 80), 'medium');
  assert.equal(classifyScore(80, 50, 80), 'high');
  assert.throws(() => classifyScore(60, 80, 50), /thresholds/);
});
