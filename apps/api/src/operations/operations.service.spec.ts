import assert from 'node:assert/strict';
import test from 'node:test';
import { ConflictException } from '@nestjs/common';
import { assertExpectedVersion, escapeLikeQuery, preferenceSchema } from './operations.service';

test('global search treats SQL LIKE wildcard characters as literal input',()=>{
  assert.equal(escapeLikeQuery('a!%_b'),'a!!!%!_b');
});

test('notification preferences accept the complete known preference shape', () => {
  assert.equal(preferenceSchema.safeParse({ newLead: true, assignment: false, whatsappMessage: true, stageUpdate: false }).success, true);
});

test('notification preferences reject incomplete and unknown properties', () => {
  assert.equal(preferenceSchema.safeParse({ newLead: true }).success, false);
  assert.equal(preferenceSchema.safeParse({ newLead: true, assignment: true, whatsappMessage: true, stageUpdate: true, admin: true }).success, false);
});

test('preference version checks accept first-save version zero and matching updates', () => {
  assert.doesNotThrow(() => assertExpectedVersion(0, null));
  assert.doesNotThrow(() => assertExpectedVersion(3, 3));
});

test('preference version checks reject stale and impossible initial versions', () => {
  assert.throws(() => assertExpectedVersion(1, null), ConflictException);
  assert.throws(() => assertExpectedVersion(2, 3), ConflictException);
});
