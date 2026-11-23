import { describe, it } from 'node:test';
import assert from 'node:assert';
import range from './range.ts';

describe('range', () => {
  it('returns an empty array if no range is provided', () => {
    const values: any = [];
    const allKeys: any = [];
    const result = range(values, allKeys);
    assert.deepStrictEqual(result, [undefined]);
  });

  it('returns an array with the start value if no end value is provided', () => {
    const values = ['1'];
    const allKeys = ['1', '2', '3'];
    const result = range(values, allKeys);
    assert.deepStrictEqual(result, ['1']);
  });

  it('returns an array with all keys within the range of start and end values', () => {
    const values = ['1:3'];
    const allKeys = ['1', '2', '3', '4'];
    const result = range(values, allKeys);
    assert.deepStrictEqual(result, ['1', '2', '3']);
  });

  it('accepts bounds that fall between keys', () => {
    assert.deepStrictEqual(range(['1500:3500'], ['1000', '2000', '3000', '4000']), ['2000', '3000']);
  });

  it('treats a missing bound as open', () => {
    const allKeys = ['10', '20', '30'];
    assert.deepStrictEqual(range([':20'], allKeys), ['10', '20']);
    assert.deepStrictEqual(range(['20:'], allKeys), ['20', '30']);
    assert.deepStrictEqual(range([':'], allKeys), allKeys);
  });

  it('matches nothing for an empty or non-numeric range', () => {
    const allKeys = ['10', '20'];
    assert.deepStrictEqual(range([''], allKeys), []);
    assert.deepStrictEqual(range(['a:b'], allKeys), []);
  });
});
