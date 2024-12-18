import { Tree } from '@unchainedshop/utils';

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

export const concatItemsByLevels = (levelArray: Array<{ level: number; items: Array<string> }>) => {
  return Object.values(
    levelArray.reduce<Record<number, Array<Array<string>>>>((acc, { level, items }) => {
      return {
        ...acc,
        [level]: [...(acc[level] || []), items],
      };
    }, {}),
  );
};

const zip = function zip(a, b) {
  const len = Math.min(a.length, b.length);
  const rv = Array(len);
  let idx = 0;
  while (idx < len) {
    rv[idx] = [a[idx], b[idx]];
    idx += 1;
  }
  return rv;
};

export const shuffleEachLevel = (unshuffledLevels: string[][][]) => {
  return unshuffledLevels.map((subArrays) => {
    const shuffled = subArrays.reduce<string[]>((a, b) => {
      const [accumulator, currentArray] = fillToSameLengthArray(a, b);
      return zip(accumulator, currentArray);
    }, []);
    return shuffled;
  });
};

export default (tree: Tree<string>): Array<string> => {
  const levels = divideTreeByLevels(tree);
  const concattedLevels = concatItemsByLevels(levels);
  const items = shuffleEachLevel(concattedLevels);
  return items.flat().filter(Boolean);
};
