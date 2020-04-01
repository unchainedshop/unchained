export default {
  async texts(product, { forceLocale }, { localeContext }) {
    return product.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
  status(product) {
    return product.normalizedStatus();
  },
  bundleItems(product) {
    return product.bundleItems ? product.bundleItems : [];
  },
  async assortmentPaths(obj, { forceLocale }, { localeContext }) {
    return obj.assortmentPaths(forceLocale || localeContext.normalized);
  },
};
