import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildFindSelector } from './configureLanguagesModule.js';

describe('buildFindSelector', () => {
  it('Return correct filter object when passed no argument', () => {
    assert.deepStrictEqual(buildFindSelector({}), { deleted: null, isActive: true });
  });

  it('Return correct filter object includeInactive is set to true', () => {
    assert.deepStrictEqual(buildFindSelector({ includeInactive: true }), { deleted: null });
  });

  it('Return correct filter object when passed includeInactive, queryString', () => {
    assert.deepStrictEqual(buildFindSelector({ includeInactive: true, queryString: 'hello world' }), {
      deleted: null,
      $text: { $search: 'hello world' },
    });
  });

  it('Return correct filter object when passed queryString', () => {
    assert.deepStrictEqual(buildFindSelector({ queryString: 'hello world' }), {
      deleted: null,
      isActive: true,
      $text: { $search: 'hello world' },
    });
  });
});
