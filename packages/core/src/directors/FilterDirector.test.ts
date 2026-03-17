import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseQueryArray } from './FilterDirector.ts';

describe('FilterDirector', () => {
  describe('parseQueryArray', () => {
    it('should return empty object for undefined', () => {
      assert.deepStrictEqual(parseQueryArray(undefined), {});
    });

    it('should return empty object for empty array', () => {
      assert.deepStrictEqual(parseQueryArray([]), {});
    });

    it('should parse single key-value pair', () => {
      const result = parseQueryArray([{ key: 'color', value: 'red' }]);
      assert.deepStrictEqual(result, { color: ['red'] });
    });

    it('should concatenate values for same key', () => {
      const result = parseQueryArray([
        { key: 'color', value: 'red' },
        { key: 'color', value: 'blue' },
      ]);
      assert.deepStrictEqual(result, { color: ['red', 'blue'] });
    });

    it('should handle multiple different keys', () => {
      const result = parseQueryArray([
        { key: 'color', value: 'red' },
        { key: 'size', value: 'large' },
      ]);
      assert.deepStrictEqual(result, { color: ['red'], size: ['large'] });
    });
  });
});
