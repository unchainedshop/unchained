export default {
  name(obj, { forceLocale }, { localeContext }) {
    return obj.name(forceLocale || localeContext.language);
  }
};
