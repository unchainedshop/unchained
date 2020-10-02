import * as R from 'ramda';

const fillUp = (arr, size) =>
  [...arr, ...new Array(size).fill(null)].slice(0, size);

const fillToSameLengthArray = (a, b) => {
  const length = Math.max(a.length, b.length);
  return [fillUp(a, length), fillUp(b, length)];
};

const divideTreeByLevels = (array, level = 0) => {
  const currentLevel = array.reduce((acc, item) => {
    if (typeof item === 'string') {
      return [...acc, item];
    }
    return acc;
  }, []);

  const nextLevels = array.reduce((acc, item) => {
    if (typeof item !== 'string') {
      return [...acc, ...divideTreeByLevels(item, level + 1)];
    }
    return acc;
  }, []);

  return [
    currentLevel.length && { level, items: currentLevel },
    ...nextLevels,
  ].filter(Boolean);
};

const concatItemsByLevels = (levelArray) => {
  return Object.values(
    levelArray.reduce((acc, { level, items }) => {
      return {
        ...acc,
        [level]: [...(acc[level] || []), items],
      };
    }, {})
  );
};

const shuffleEachLevel = (unshuffledLevels) => {
  return unshuffledLevels.map((subArrays) => {
    const shuffled = subArrays.reduce((a, b) => {
      const [accumulator, currentArray] = fillToSameLengthArray(a, b);
      return R.zip(accumulator, currentArray);
    }, []);
    return shuffled;
  });
};

export default (tree) => {
  const levels = divideTreeByLevels(tree);
  const concattedLevels = concatItemsByLevels(levels);
  const items = shuffleEachLevel(concattedLevels);

  const zipped = R.pipe(R.flatten, R.filter(Boolean))(items);
  return zipped;
};
