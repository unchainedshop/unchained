import { Tree } from '@unchainedshop/utils';
import zipTreeBySimplyFlattening from './zipTreeBySimplyFlattening.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('zipTreeBySimplyFlattening', () => {
  it('should return the expected result', () => {
    const array: Tree<string> = ['a', ['b', ['c', 'd']], 'e'];
    const expected = ['a', 'b', 'c', 'd', 'e'];

    assert.deepStrictEqual(zipTreeBySimplyFlattening(array), expected);
  });
});
