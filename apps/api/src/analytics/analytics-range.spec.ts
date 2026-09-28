import { BadRequestException } from '@nestjs/common';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { parseAnalyticsRange } from './analytics.controller';

test('analytics range uses UTC inclusive dates and an exclusive next-day boundary', () => {
  const range = parseAnalyticsRange('2026-09-01','2026-09-30');
  assert.equal(range.days,30);
  assert.equal(range.start,'2026-09-01T00:00:00.000Z');
  assert.equal(range.endExclusive,'2026-10-01T00:00:00.000Z');
});

test('analytics range rejects impossible dates and reversed ranges', () => {
  assert.throws(()=>parseAnalyticsRange('2026-02-30','2026-03-01'),BadRequestException);
  assert.throws(()=>parseAnalyticsRange('2026-09-02','2026-09-01'),BadRequestException);
});

test('analytics range caps queries at 366 inclusive days', () => {
  assert.equal(parseAnalyticsRange('2025-09-28','2026-09-28').days,366);
  assert.throws(()=>parseAnalyticsRange('2025-09-28','2026-09-29'),BadRequestException);
});
