import { describe, it } from 'node:test';
import assert from 'node:assert';
import invertMapObject from './object-invert.ts';

describe('invertMapObject', () => {
  it('should invert key-value pairs', () => {
    const input = { a: '1', b: '2', c: '3' };
    const result = invertMapObject(input);
    assert.deepStrictEqual(result, { '1': 'a', '2': 'b', '3': 'c' });
  });

  it('should handle empty object', () => {
    assert.deepStrictEqual(invertMapObject({}), {});
  });

  it('should handle single entry', () => {
    assert.deepStrictEqual(invertMapObject({ key: 'value' }), { value: 'key' });
  });
});
