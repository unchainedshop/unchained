import { Tree } from '@unchainedshop/utils';
import * as R from 'ramda';

export const fillUp = <T>(arr: Array<T>, size: number): Array<T> =>
  [...arr, ...new Array(size).fill(null)].slice(0, size);

export const fillToSameLengthArray = <T>(a: Array<T>, b: Array<T>) => {
  const length = Math.max(a.length, b.length);
  return [fillUp(a, length), fillUp(b, length)];
};

export const divideTreeByLevels = (
  array: Tree<string>,
  level = 0,
): Array<{ level: number; items: Array<string> }> => {
  const currentLevel: Array<string> = array.reduce((acc, item) => {
    if (typeof item === 'object') {
      return acc;
    }
    return [...acc, item];
  }, []) as Array<string>;

  const nextLevels = array.reduce((acc, item) => {
    if (typeof item === 'object') {
      return [...acc, ...divideTreeByLevels(item, level + 1)];
    }
    return acc;
  }, []) as Array<{ level: number; items: Array<string> }>;

  return [currentLevel.length && { level, items: currentLevel }, ...nextLevels].filter(Boolean);
};

export const concatItemsByLevels = (levelArray): Tree<string> => {
  return Object.values(
    levelArray.reduce((acc, { level, items }) => {
      return {
        ...acc,
        [level]: [...(acc[level] || []), items],
      };
    }, {}),
  );
};

export const shuffleEachLevel = (unshuffledLevels) => {
  return unshuffledLevels.map((subArrays) => {
    const shuffled = subArrays.reduce((a, b) => {
      const [accumulator, currentArray] = fillToSameLengthArray(a, b);
      return R.zip(accumulator, currentArray);
    }, []);
    return shuffled;
  });
};

export default (tree: Tree<string>): Array<string> => {
  const levels = divideTreeByLevels(tree);
  const concattedLevels = concatItemsByLevels(levels);
  const items = shuffleEachLevel(concattedLevels);
  const zipped: Array<string> = R.pipe(R.flatten, R.filter(Boolean))(items);
  return zipped;
};
