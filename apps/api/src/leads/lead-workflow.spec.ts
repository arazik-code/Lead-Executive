import assert from 'node:assert/strict';
import test from 'node:test';
import { assertLeadTransition } from './lead-workflow';

test('allows forward qualification and nurture recovery transitions', () => {
  assert.doesNotThrow(() => assertLeadTransition('new', 'qualifying'));
  assert.doesNotThrow(() => assertLeadTransition('qualified', 'assigned'));
  assert.doesNotThrow(() => assertLeadTransition('lost', 'nurture'));
});

test('blocks skipped stages and transitions out of won', () => {
  assert.throws(() => assertLeadTransition('new', 'won'));
  assert.throws(() => assertLeadTransition('won', 'nurture'));
});
