import { describe, it } from 'node:test';
import assert from 'node:assert';
import { filterCacheGeneration } from './FiltersCollection.ts';

describe('filterCacheGeneration', () => {
  it('uses the updated stamp when present', () => {
    const updated = new Date('2020-03-16T09:32:31.996+0000');
    assert.strictEqual(
      filterCacheGeneration({ updated, created: new Date('2020-01-01T00:00:00.000+0000') }),
      updated.getTime(),
    );
  });

  it('falls back to the created stamp', () => {
    const created = new Date('2020-01-01T00:00:00.000+0000');
    assert.strictEqual(filterCacheGeneration({ created }), created.getTime());
  });

  it('accepts string timestamps from documents written outside the module API', () => {
    assert.strictEqual(
      filterCacheGeneration({ updated: '2020-03-16T09:32:31.996+0000' } as any),
      new Date('2020-03-16T09:32:31.996+0000').getTime(),
    );
  });

  it('degrades to generation 0 for unparseable stamps', () => {
    assert.strictEqual(filterCacheGeneration({ updated: 'not-a-date' } as any), 0);
  });

  it('degrades to generation 0 when no stamp exists', () => {
    assert.strictEqual(filterCacheGeneration({}), 0);
    assert.strictEqual(filterCacheGeneration(undefined as any), 0);
  });
});
