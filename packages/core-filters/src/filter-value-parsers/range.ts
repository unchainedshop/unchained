export default (values: string[], allKeys): (string | undefined)[] => {
  const [range] = values;
  if (range === undefined) return [undefined];
  const [start, end] = range?.split(':') || [];
  if (range === null || !start) return [];
  const nStart = Number(start);
  if (!end) return [start];
  const nEnd = Number(end);
  const keys = allKeys.flatMap((key) => {
    const nKey = Number(key);
    if (key && nStart <= nKey && nEnd >= nKey) {
      return [key];
    }
    return [];
  });
  return keys;
};
