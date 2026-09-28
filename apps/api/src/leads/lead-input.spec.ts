import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeLeadPhone, validateBudget } from './lead-input';

test('normalizes a UAE mobile number to E.164', () => {
  assert.equal(normalizeLeadPhone('050 123 4567'), '+971501234567');
  assert.equal(normalizeLeadPhone('+971 50 123 4567'), '+971501234567');
});

test('rejects malformed phone numbers', () => {
  assert.throws(() => normalizeLeadPhone('12345'));
});

test('budget amount and currency must be supplied together', () => {
  assert.throws(() => validateBudget(2_000_000, undefined));
  assert.throws(() => validateBudget(undefined, 'AED'));
  assert.doesNotThrow(() => validateBudget(2_000_000, 'AED'));
});
