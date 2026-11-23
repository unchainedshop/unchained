export default (values: string[], allKeys): (string | undefined)[] => {
  const [range] = values;
  if (range === undefined) return [undefined];
  if (!range) return [];
  if (!range.includes(':')) return [range];
  const [start, end] = range.split(':');
  const lowerBound = start ? Number(start) : -Infinity;
  const upperBound = end ? Number(end) : Infinity;
  return allKeys.filter((key) => key && lowerBound <= Number(key) && Number(key) <= upperBound);
};
