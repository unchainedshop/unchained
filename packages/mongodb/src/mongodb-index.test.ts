import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SortDirection } from '@unchainedshop/utils';
import { buildSortOptions, generateDbObjectId } from './mongodb-index.js';

describe('Mongo', () => {
  it('Init', () => {
    assert(true);
  });

  describe('buildSortOptions', () => {
    it('should return the correct db sort format', () => {
      const sort = [
        { key: 'name', value: SortDirection.ASC },
        { key: 'age', value: SortDirection.DESC },
      ];
      assert.deepStrictEqual(buildSortOptions(sort), { name: 1, age: -1 });
    });
  });

  describe('generateDbObjectId', () => {
    it('generateDbObjectId with default digits', () => {
      const result = generateDbObjectId();
      assert.strictEqual(typeof result, 'string');
      assert.strictEqual(result.length, 24);
    });

    it('generateDbObjectId with odd digits', () => {
      const result = generateDbObjectId(23);
      assert.strictEqual(typeof result, 'string');
      assert.strictEqual(result.length, 23);
    });

    it('generateDbObjectId with even digits', () => {
      const result = generateDbObjectId(24);
      assert.strictEqual(typeof result, 'string');
      assert.strictEqual(result.length, 24);
    });
  });
});
