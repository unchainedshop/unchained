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
  products(obj, { vectors }) {
    return obj.proxyProducts(vectors);
  },
};
