export default {
  async texts(obj, { forceLocale }, { localeContext }) {
    return obj.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
  status(obj) {
    return obj.normalizedStatus();
  },
  assignments(obj) {
    return obj.proxyAssignments();
  },
  async products(obj, { vectors = [], includeInactive } = {}) {
    return obj.proxyProducts(vectors, { includeInactive });
  },
  async assortmentPaths(obj, { forceLocale }, { localeContext }) {
    return obj.assortmentPaths(forceLocale || localeContext.normalized);
  },
  async media(obj, props) {
    return obj.media(props);
  }
};
