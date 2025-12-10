import { describe, it } from 'node:test';
import { buildFindSelector } from './configureCountriesModule.ts';
import assert from 'node:assert';

describe('buildFindSelector', () => {
  it('should return correct filter object', () => {
    assert.deepStrictEqual(buildFindSelector({ includeInactive: true, queryString: 'hello world' }), {
      deleted: null,
      $text: { $search: 'hello world' },
    });
    assert.deepStrictEqual(buildFindSelector({ includeInactive: true }), { deleted: null });
    assert.deepStrictEqual(buildFindSelector({ queryString: 'hello world' }), {
      deleted: null,
      $text: { $search: 'hello world' },
      isActive: true,
    });
  });
});
