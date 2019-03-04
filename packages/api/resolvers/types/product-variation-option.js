export default {
  _id(obj) {
    return `${obj._id}:${obj.productVariationOption}`;
  },
  value(obj) {
    return obj.productVariationOption;
  },
  texts(obj, { forceLocale }, { localeContext }) {
    return obj.getLocalizedTexts(
      forceLocale || localeContext.normalized,
      obj.productVariationOption
    );
  }
};
