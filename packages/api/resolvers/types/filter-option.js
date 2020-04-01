export default {
  _id(obj) {
    return `${obj._id}:${obj.filterOption}`;
  },
  value(obj) {
    return obj.filterOption;
  },
  async texts(obj, { forceLocale }, { localeContext }) {
    return obj.getLocalizedTexts(
      forceLocale || localeContext.normalized,
      obj.filterOption
    );
  },
};
