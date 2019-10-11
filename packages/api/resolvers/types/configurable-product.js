export default {
  texts(obj, { forceLocale }, { localeContext }) {
    return obj.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
  status(obj) {
    return obj.normalizedStatus();
  },
  assignments(obj) {
    return obj.proxyAssignments();
  },
  products(obj, { vectors = [], includeInactive } = {}) {
    return obj.proxyProducts(vectors, { includeInactive });
  },
  assortmentPaths(obj, { forceLocale }, { localeContext }) {
    return obj.assortmentPaths(forceLocale || localeContext.normalized);
  }
};
