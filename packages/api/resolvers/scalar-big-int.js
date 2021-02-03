export default {
  __parseValue(value) {
    return value;
  },
  __serialize(value) {
    if (value === Number.POSITIVE_INFINITY) {
      return 'Infinity';
    }
    return value;
  },
};
