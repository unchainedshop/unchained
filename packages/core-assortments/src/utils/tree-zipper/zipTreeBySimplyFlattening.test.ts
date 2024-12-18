import { Tree } from '@unchainedshop/utils';
import zipTreeBySimplyFlattening from './zipTreeBySimplyFlattening.js';

describe('zipTreeBySimplyFlattening', () => {
  it('should return the expected result', () => {
    const array: Tree<string> = ['a', ['b', ['c', 'd']], 'e'];
    const expected = ['a', 'b', 'c', 'd', 'e'];

    expect(zipTreeBySimplyFlattening(array)).toEqual(expected);
  });
});
