export default {
  _id(obj) {
    return `${obj._id}:${obj.productVariationOption}`;
  },
  value(obj) {
    return obj.productVariationOption;
  },
  async texts(obj, { forceLocale }, { localeContext }) {
    return obj.getLocalizedTexts(
      forceLocale || localeContext.normalized,
      obj.productVariationOption,
    );
  },
};
