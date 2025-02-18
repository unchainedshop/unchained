import { Tree } from '@unchainedshop/utils';
import {
  concatItemsByLevels,
  divideTreeByLevels,
  fillToSameLengthArray,
  fillUp,
} from './zipTreeByDeepness.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('divideTreeByLevels', () => {
  it('should return the expected result', () => {
    const array: Tree<string> = ['a', ['b', ['c', 'd']], 'e'];
    const expected = [
      {
        level: 0,
        items: ['a', 'e'],
      },
      {
        level: 1,
        items: ['b'],
      },
      {
        level: 2,
        items: ['c', 'd'],
      },
    ];

    assert.deepStrictEqual(divideTreeByLevels(array), expected);
  });
});

describe('fillUp', () => {
  it('should fill empty spaces with null based on the passed size parameter', () => {
    const arr = [1, 2, 3];
    const size = 5;

    const result = fillUp(arr, size);

    assert.deepStrictEqual(result, [1, 2, 3, null, null]);
  });
});

describe('fillToSameLengthArray', () => {
  it('should fill missing value place with null', () => {
    const a = [1, 2, 3];
    const b = [4, 5];

    const result = fillToSameLengthArray(a, b);

    assert.deepStrictEqual(result, [
      [1, 2, 3],
      [4, 5, null],
    ]);
  });
});

describe('concatItemsByLevels', () => {
  it('should concatenate the array and create array with length 2', () => {
    const levelArray = [
      { level: 1, items: ['a', 'b'] },
      { level: 2, items: ['c', 'd'] },
      { level: 1, items: ['e', 'f'] },
    ];
    const result = concatItemsByLevels(levelArray);
    assert.equal(result.length, 2);
  });
});
