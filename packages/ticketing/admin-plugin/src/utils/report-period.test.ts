import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromDateInputValue, reportPeriod, toDateInputValue } from './report-period.ts';

const now = new Date(2030, 2, 15, 14, 30);
const days = (period: ReturnType<typeof reportPeriod>) =>
  period && [toDateInputValue(period.from), toDateInputValue(period.to)];

test('report periods end exclusively at the start of the next day', () => {
  assert.deepEqual(days(reportPeriod('today', now)), ['2030-03-15', '2030-03-16']);
  assert.deepEqual(days(reportPeriod('yesterday', now)), ['2030-03-14', '2030-03-15']);
  assert.deepEqual(days(reportPeriod('thisMonth', now)), ['2030-03-01', '2030-04-01']);
  assert.deepEqual(days(reportPeriod('lastMonth', new Date(2030, 0, 10))), ['2029-12-01', '2030-01-01']);
  assert.deepEqual(days(reportPeriod('thisYear', now)), ['2030-01-01', '2031-01-01']);
  assert.equal(reportPeriod('today', now)!.from.getHours(), 0);
});

test('custom periods include both days and need them in order', () => {
  assert.deepEqual(days(reportPeriod('custom', now, { fromDay: '2030-02-01', toDay: '2030-02-28' })), [
    '2030-02-01',
    '2030-03-01',
  ]);
  assert.equal(reportPeriod('custom', now, { fromDay: '2030-02-02', toDay: '2030-02-01' }), null);
  assert.equal(reportPeriod('custom', now, { fromDay: '' }), null);
  assert.equal(fromDateInputValue('2030-13'), null);
});
