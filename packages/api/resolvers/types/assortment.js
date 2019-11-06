export default {
  async texts(obj, { forceLocale }, { localeContext }) {
    return obj.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
  async assortmentPaths(obj, { forceLocale }, { localeContext }) {
    return obj.assortmentPaths(forceLocale || localeContext.normalized);
  }
};
