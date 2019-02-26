export default {
  texts(product, { forceLocale }, { localeContext }) {
    return product.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
  status(product) {
    return product.normalizedStatus();
  },
  setItems(product) {
    return product.setItems ? product.setItems : [];
  },
};
