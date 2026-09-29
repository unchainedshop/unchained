import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isWithinEntryWindow } from './entry-window.ts';

const start = new Date('2026-10-01T18:00:00.000Z');
const at = (iso: string) => new Date(iso);

test('the entry window opens and closes around the event start, bounds included', () => {
  const window = { start, opensMinutesBefore: 120, closesMinutesAfter: 60 };
  assert.equal(isWithinEntryWindow({ ...window, referenceDate: at('2026-10-01T15:59:59.999Z') }), false);
  assert.equal(isWithinEntryWindow({ ...window, referenceDate: at('2026-10-01T16:00:00.000Z') }), true);
  assert.equal(isWithinEntryWindow({ ...window, referenceDate: at('2026-10-01T18:30:00.000Z') }), true);
  assert.equal(isWithinEntryWindow({ ...window, referenceDate: at('2026-10-01T19:00:00.000Z') }), true);
  assert.equal(isWithinEntryWindow({ ...window, referenceDate: at('2026-10-01T19:00:00.001Z') }), false);
});

test('a missing bound leaves that side of the window open', () => {
  const early = at('2026-01-01T00:00:00.000Z');
  const late = at('2027-01-01T00:00:00.000Z');
  assert.equal(isWithinEntryWindow({ start, referenceDate: early, closesMinutesAfter: 60 }), true);
  assert.equal(isWithinEntryWindow({ start, referenceDate: late, closesMinutesAfter: 60 }), false);
  assert.equal(isWithinEntryWindow({ start, referenceDate: late, opensMinutesBefore: null }), true);
  assert.equal(isWithinEntryWindow({ start, referenceDate: early, opensMinutesBefore: 60 }), false);
  assert.equal(isWithinEntryWindow({ start, referenceDate: early }), true);
});

test('tickets without an event start can always be redeemed', () => {
  const referenceDate = at('2030-01-01T00:00:00.000Z');
  assert.equal(isWithinEntryWindow({ start: undefined, referenceDate, opensMinutesBefore: 1 }), true);
  assert.equal(isWithinEntryWindow({ start: null, referenceDate, closesMinutesAfter: 1 }), true);
});

test('an unparsable event start or reference date never lets anyone in', () => {
  assert.equal(isWithinEntryWindow({ start: new Date('nonsense'), referenceDate: start }), false);
  assert.equal(isWithinEntryWindow({ start, referenceDate: new Date('nonsense') }), false);
});

test('the window is computed in absolute time across a daylight saving switch', () => {
  // 2026-10-25 01:00 UTC is the end of summer time in Europe; 120 minutes stay 120 minutes.
  const dstStart = at('2026-10-25T02:30:00.000Z');
  const window = { start: dstStart, opensMinutesBefore: 120, closesMinutesAfter: 0 };
  assert.equal(isWithinEntryWindow({ ...window, referenceDate: at('2026-10-25T00:30:00.000Z') }), true);
  assert.equal(isWithinEntryWindow({ ...window, referenceDate: at('2026-10-25T00:29:59.999Z') }), false);
});
