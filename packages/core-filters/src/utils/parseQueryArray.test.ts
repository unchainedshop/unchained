import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseQueryArray } from './parseQueryArray.js';

describe('parseQueryArray', () => {
  it('parses empty array', () => {
    const query = [];
    const expected = {};
    const result = parseQueryArray(query);
    assert.deepStrictEqual(result, expected);
  });

  it('parses array with one key-value pair', () => {
    const query = [{ key: 'foo', value: 'bar' }];
    const expected = { foo: ['bar'] };
    const result = parseQueryArray(query);
    assert.deepStrictEqual(result, expected);
  });

  it('parses array with multiple key-value pairs', () => {
    const query = [
      { key: 'foo', value: 'bar' },
      { key: 'baz', value: 'qux' },
    ];
    const expected = { foo: ['bar'], baz: ['qux'] };
    const result = parseQueryArray(query);
    assert.deepStrictEqual(result, expected);
  });

  it('parses array with multiple values for the same key', () => {
    const query = [
      { key: 'foo', value: 'bar' },
      { key: 'foo', value: 'baz' },
    ];
    const expected = { foo: ['bar', 'baz'] };
    const result = parseQueryArray(query);
    assert.deepStrictEqual(result, expected);
  });
});
