import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPerformanceGrid } from './production-grid.ts';

const assignment = (slot: string, category: string | null, _id: string) => ({
  vectors: [
    { variation: { key: 'slot' }, option: { value: slot } },
    ...(category ? [{ variation: { key: 'category' }, option: { value: category } }] : []),
  ],
  product: { _id },
});

test('the performances of a production become rows by start and columns by category', () => {
  const grid = buildPerformanceGrid({
    ticketProduction: { categories: [{ code: 'adult' }, { code: 'reduced' }] },
    assignments: [
      assignment('2026-11-02T18:00:00.000Z', 'reduced', 'd'),
      assignment('2026-11-01T18:00:00.000Z', 'adult', 'a'),
      assignment('2026-11-01T18:00:00.000Z', 'reduced', 'b'),
      assignment('2026-11-02T18:00:00.000Z', 'adult', 'c'),
    ],
  });
  assert.deepEqual(grid.columns, ['adult', 'reduced']);
  assert.deepEqual(
    grid.rows.map(({ startsAt, cells }) => [startsAt, cells.adult?._id, cells.reduced?._id]),
    [
      ['2026-11-01T18:00:00.000Z', 'a', 'b'],
      ['2026-11-02T18:00:00.000Z', 'c', 'd'],
    ],
  );
});

test('a production without categories has one column', () => {
  const grid = buildPerformanceGrid({
    ticketProduction: { categories: [] },
    assignments: [assignment('2026-11-01T18:00:00.000Z', null, 'a')],
  });
  assert.deepEqual(grid.columns, [null]);
  assert.equal(grid.rows[0].cells[''], undefined);
  assert.equal(grid.rows[0].products[0]._id, 'a');
  assert.deepEqual(buildPerformanceGrid(null), { columns: [null], rows: [] });
});
