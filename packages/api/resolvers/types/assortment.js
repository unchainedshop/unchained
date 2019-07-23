export default {
  texts(obj, { forceLocale }, { localeContext }) {
    return obj.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
  paths(obj, { forceLocale }, { localeContext }) {
    return obj.paths(forceLocale || localeContext.normalized);
  }
};
