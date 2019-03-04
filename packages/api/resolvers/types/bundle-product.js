export default {
  texts(product, { forceLocale }, { localeContext }) {
    return product.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
  status(product) {
    return product.normalizedStatus();
  },
  bundleItems(product) {
    return product.bundleItems ? product.bundleItems : [];
  },
};
