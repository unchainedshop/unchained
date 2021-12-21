import { AssortmentHelperTypes } from '@unchainedshop/types/assortments';
import { Query } from '@unchainedshop/types/common';

export const Assortment: AssortmentHelperTypes = {
  childrenCount: async (
    assortment,
    { includeInactive = false },
    { modules }
  ) => {
    const assortmentChildrenIds = await modules.assortments.links.findLinks({
      parentAssortmentId: assortment._id as string,
    });
    const assortmentIds = assortmentChildrenIds.map(
      ({ childAssortmentId }) => childAssortmentId
    );

    const selector: Query = {
      _id: { $in: assortmentIds },
    };
    if (!includeInactive) {
      selector.isActive = true;
    }

    return await modules.assortments.count(selector);
  },

  async texts(obj, { forceLocale }, { modules, localeContext }) {
    return await modules.assortments.texts.findTexts
    return obj.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
  // async assortmentPaths(obj, { forceLocale }, { localeContext }) {
  //   return obj.assortmentPaths(forceLocale || localeContext.normalized);
  // },
  // async media(obj, props) {
  //   return obj.media(props);
  // },

  // TODO: use services
  // async search(obj, query, context) {
  //   return obj.searchProducts({ query, context });
  // },
  // async searchProducts(obj, query, context) {
  //   return obj.searchProducts({ query, context });
  // },
};
