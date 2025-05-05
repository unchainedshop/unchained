import { AssortmentFilter as AssortmentFilterType } from '@unchainedshop/core-assortments';
import { Context } from '../../../context.js';

export const AssortmentFilter = {
  async assortment(obj: AssortmentFilterType, _, { loaders }: Context) {
    return loaders.assortmentLoader.load({
      assortmentId: obj.assortmentId,
    });
  },

  async filter(obj: AssortmentFilterType, _, { loaders }: Context) {
    return loaders.filterLoader.load({
      filterId: obj.filterId,
    });
  },
};
