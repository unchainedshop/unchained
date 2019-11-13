export default query =>
  (query || []).reduce(
    (accumulator, { key, value }) => ({
      ...accumulator,
      [key]: accumulator[key] ? accumulator[key].concat(value) : [value]
    }),
    {}
  );
