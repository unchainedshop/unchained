export default {
  options(obj) {
    return (obj.options || [])
      .map(obj.optionObject.bind(obj));
  },
  texts(obj, { forceLocale }, { localeContext }) {
    return obj.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
};
