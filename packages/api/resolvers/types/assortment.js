import {
  Assortments,
  AssortmentLinks,
} from 'meteor/unchained:core-assortments';

export default {
  async childrenCount(assortment, { includeInactive = false } = {}) {
    const assortmentIds = AssortmentLinks.find(
      {
        parentAssortmentId: assortment._id,
      },
      {
        fields: {
          childAssortmentId: 1,
        },
      }
    ).map(({ childAssortmentId }) => childAssortmentId);
    const selector = {
      _id: { $in: assortmentIds },
    };
    if (!includeInactive) {
      selector.isActive = true;
    }
    return Assortments.find(selector).count();
  },
  async texts(obj, { forceLocale }, { localeContext }) {
    return obj.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
  async assortmentPaths(obj, { forceLocale }, { localeContext }) {
    return obj.assortmentPaths(forceLocale || localeContext.normalized);
  },
  async search(obj, query, context) {
    return obj.searchProducts({ query, context });
  },
  async searchProducts(obj, query, context) {
    return obj.searchProducts({ query, context });
  },
};
