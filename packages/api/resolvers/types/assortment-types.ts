import { AssortmentHelperTypes } from '@unchainedshop/types/assortments';
import { Query } from '@unchainedshop/types/common';

export const Assortment: AssortmentHelperTypes = {
  async assortmentPaths(obj, { forceLocale }, { modules, localeContext }) {
    return await modules.assortments.breadcrumbs({
      assortmentId: obj._id as string,
      locale: forceLocale || localeContext.normalized,
    });
  },

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

  async media(obj, params, { modules }) {
    return await modules.assortments.media.findAssortmentMedias({
      assortmentId: obj._id as string,
      ...params,
    });
  },

  async texts(obj, { forceLocale }, { modules, localeContext }) {
    return await modules.assortments.texts.findLocalizedText({
      assortmentId: obj._id as string,
      locale: forceLocale || localeContext.normalized,
    });
  },

  // TODO: use services
  // async search(obj, query, context) {
  //   return obj.searchProducts({ query, context });
  // },
  // async searchProducts(obj, query, context) {
  //   return obj.searchProducts({ query, context });
  // },
};
