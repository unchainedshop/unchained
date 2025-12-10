import { describe, it } from 'node:test';
import assert from 'node:assert';
import { rangeMatcher } from '../enrollments/licensed.ts';

describe('rangeMatcher', () => {
  const now = new Date();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimestamp = tomorrow.getTime();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayTimestamp = yesterday.getTime();

  it('matches correctly when the date is within the range', () => {
    const range = { start: yesterday, end: tomorrow };
    const matcher = rangeMatcher(now);
    assert.strictEqual(matcher(range), true);
  });

  it('does not match when the date is before the start of the range', () => {
    const range = { start: tomorrow, end: tomorrow };
    const matcher = rangeMatcher(yesterday);
    assert.strictEqual(matcher(range), false);
  });

  it('does not match when the date is after the end of the range', () => {
    const range = { start: yesterday, end: yesterday };
    const matcher = rangeMatcher(tomorrow);
    assert.strictEqual(matcher(range), false);
  });

  it('matches correctly when the date is not provided', () => {
    const range = { start: yesterdayTimestamp, end: tomorrowTimestamp };
    const matcher = rangeMatcher();
    assert.strictEqual(matcher(range), true);
  });
});
