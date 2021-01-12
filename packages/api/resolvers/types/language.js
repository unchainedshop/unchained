export default {
  name(obj) {
    return `${obj.isoCode}${obj.isBase() ? ' (Base)' : ''}`;
  },
};
