import { describe, it } from 'node:test';
import assert from 'node:assert';
import { addToDate } from './addToDate.ts';

const inTimeZone = (t: { after: (fn: () => void) => void }, timeZone: string) => {
  const { TZ } = process.env;
  t.after(() => {
    if (TZ === undefined) delete process.env.TZ;
    else process.env.TZ = TZ;
  });
  process.env.TZ = timeZone;
};

const add = (iso: string, duration: Parameters<typeof addToDate>[1]) =>
  addToDate(new Date(iso), duration).toISOString();

describe('addToDate', () => {
  it('clamps to the end of shorter months', (t) => {
    inTimeZone(t, 'UTC');
    assert.strictEqual(add('2024-01-31T10:00:00.000Z', { months: 1 }), '2024-02-29T10:00:00.000Z');
    assert.strictEqual(add('2024-02-29T10:00:00.000Z', { years: 1 }), '2025-02-28T10:00:00.000Z');
  });

  it('returns the same instant for an empty or zero duration', (t) => {
    inTimeZone(t, 'Europe/Zurich');
    assert.strictEqual(add('2026-03-29T00:30:00.000Z', {}), '2026-03-29T00:30:00.000Z');
    assert.strictEqual(add('2026-03-29T00:30:00.000Z', { months: 0 }), '2026-03-29T00:30:00.000Z');
  });

  it('adds calendar units in wall-clock time and time units exactly across DST', (t) => {
    inTimeZone(t, 'Europe/Zurich');
    assert.strictEqual(add('2026-03-28T12:00:00.000Z', { days: 1 }), '2026-03-29T11:00:00.000Z');
    assert.strictEqual(add('2026-03-28T12:00:00.000Z', { hours: 24 }), '2026-03-29T12:00:00.000Z');
  });

  it('keeps the wall-clock time when an intermediate step would fall into a DST gap', (t) => {
    inTimeZone(t, 'America/New_York');
    assert.strictEqual(
      add('2023-03-14T06:57:49.567Z', { years: 4, weeks: 10 }),
      '2027-05-23T06:57:49.567Z',
    );
  });
});
