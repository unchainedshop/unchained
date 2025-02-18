import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildFindSelector } from './configureFiltersModule.js';

describe('buildFindSelector', () => {
  it('Return correct filter object when passed no argument', () => {
    assert.deepStrictEqual(buildFindSelector({}), { isActive: true });
  });

  it('Return correct filter object when inactive is set to true', () => {
    assert.deepStrictEqual(buildFindSelector({ includeInactive: true }), {});
  });

  it('Return correct filter object when passed filterIds and queryString', () => {
    assert.deepStrictEqual(
      buildFindSelector({ filterIds: ['filter-1', 'filter-2'], queryString: 'Hello world' }),
      {
        isActive: true,
        _id: { $in: ['filter-1', 'filter-2'] },
        $text: { $search: 'Hello world' },
      },
    );
  });

  it('Return correct filter object when passed filterIds', () => {
    assert.deepStrictEqual(buildFindSelector({ filterIds: ['filter-1', 'filter-2'] }), {
      isActive: true,
      _id: { $in: ['filter-1', 'filter-2'] },
    });
  });

  it('Return correct filter object when passed queryString', () => {
    assert.deepStrictEqual(buildFindSelector({ queryString: 'Hello world' }), {
      isActive: true,
      $text: { $search: 'Hello world' },
    });
  });
});
