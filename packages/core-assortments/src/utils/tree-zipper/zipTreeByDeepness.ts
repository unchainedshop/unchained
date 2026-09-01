import { type Tree } from '@unchainedshop/utils';

export const fillUp = <T>(arr: T[], size: number): T[] =>
  [...arr, ...new Array(size).fill(null)].slice(0, size);

export const fillToSameLengthArray = <T>(a: T[], b: T[]) => {
  const length = Math.max(a.length, b.length);
  return [fillUp(a, length), fillUp(b, length)];
};

interface Level {
  level: number;
  items: string[];
}

export const divideTreeByLevels = (array: Tree<string>, level = 0): Level[] => {
  const result: Level[] = [];
  const stack: { array: Tree<string>; level: number }[] = [{ array, level }];

  while (stack.length > 0) {
    const { array: current, level: currentLevel } = stack.pop()!;
    const items: string[] = [];
    const children: Tree<string>[] = [];

    for (const item of current) {
      if (typeof item === 'object') {
        children.push(item);
      } else {
        items.push(item);
      }
    }

    if (items.length) {
      result.push({ level: currentLevel, items });
    }

    // Push in reverse so they are popped in original left-to-right order
    for (let i = children.length - 1; i >= 0; i--) {
      stack.push({ array: children[i], level: currentLevel + 1 });
    }
  }

  return result;
};

export const concatItemsByLevels = (levelArray: Level[]) => {
  return Object.values(
    levelArray.reduce<Record<number, string[][]>>((acc, { level, items }) => {
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

export default (tree: Tree<string>): string[] => {
  const levels = divideTreeByLevels(tree);
  const concattedLevels = concatItemsByLevels(levels);
  const items = shuffleEachLevel(concattedLevels);

  // Iterative flatten to avoid stack overflow: shuffleEachLevel produces deeply
  // nested arrays (zip-reducing N sub-arrays nests ~N deep), which makes V8's
  // recursive .flat(Infinity) blow the stack on large assortment trees.
  // Seed the stack reversed so top-level order (level 0 first) is preserved.
  const result: string[] = [];
  const stack: unknown[] = [...items].reverse();
  while (stack.length > 0) {
    const value = stack.pop();
    if (Array.isArray(value)) {
      for (let i = value.length - 1; i >= 0; i--) {
        stack.push(value[i]);
      }
    } else if (value) {
      result.push(value as string);
    }
  }
  return result;
};
