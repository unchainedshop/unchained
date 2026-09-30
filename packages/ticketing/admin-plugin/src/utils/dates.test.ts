import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EVENT_START_SORT_KEY,
  getGateSlotRange,
  getEventListFilter,
  toDateTimeLocalValue,
  fromDateTimeLocalValue,
} from './dates.ts';

test('the gate lists the events of today, including the ones that started last evening', () => {
  // Local-time constructors keep the test independent of the machine's time zone.
  assert.deepEqual(getGateSlotRange(new Date(2026, 8, 29, 14, 30)), {
    slotFrom: new Date(2026, 8, 28, 18).toISOString(),
    slotTo: new Date(2026, 8, 29, 23, 59, 59, 999).toISOString(),
  });
  // Stable for the whole day, so polling does not change the query variables.
  assert.deepEqual(
    getGateSlotRange(new Date(2026, 8, 29, 0, 5)),
    getGateSlotRange(new Date(2026, 8, 29, 23, 55)),
  );
});

test('the event list pages upcoming, past or all events by event start', () => {
  const now = new Date(2026, 8, 29, 14, 30);
  const startOfToday = new Date(2026, 8, 29);
  assert.equal(EVENT_START_SORT_KEY, 'meta.slot');
  assert.deepEqual(getEventListFilter('upcoming', now), {
    slotFrom: startOfToday.toISOString(),
    sort: [
      { key: EVENT_START_SORT_KEY, value: 'ASC' },
      { key: '_id', value: 'ASC' },
    ],
  });
  assert.deepEqual(getEventListFilter('past', now), {
    slotTo: new Date(startOfToday.getTime() - 1).toISOString(),
    sort: [
      { key: EVENT_START_SORT_KEY, value: 'DESC' },
      { key: '_id', value: 'DESC' },
    ],
  });
  assert.deepEqual(getEventListFilter('all', now), {
    sort: [
      { key: EVENT_START_SORT_KEY, value: 'DESC' },
      { key: '_id', value: 'DESC' },
    ],
  });
  assert.deepEqual(getEventListFilter(undefined, now), getEventListFilter('upcoming', now));
  assert.deepEqual(getEventListFilter('bogus', now), getEventListFilter('upcoming', now));
});

test('datetime-local values round-trip in the browser time zone', () => {
  const local = new Date(2026, 8, 29, 20, 5);
  assert.equal(toDateTimeLocalValue(local), '2026-09-29T20:05');
  assert.equal(toDateTimeLocalValue(local.toISOString()), '2026-09-29T20:05');
  assert.equal(toDateTimeLocalValue(null), '');
  assert.equal(toDateTimeLocalValue('not a date'), '');
  assert.equal(fromDateTimeLocalValue('2026-09-29T20:05')?.getTime(), local.getTime());
  assert.equal(fromDateTimeLocalValue(''), null);
  assert.equal(fromDateTimeLocalValue('  '), null);
  assert.ok(Number.isNaN(fromDateTimeLocalValue('tomorrow')?.getTime()));
});
