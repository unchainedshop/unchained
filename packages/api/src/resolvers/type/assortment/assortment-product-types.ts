import type { Context } from '../../../context.ts';
import type {
  Assortment,
  AssortmentProduct as AssortmentProductType,
} from '@unchainedshop/core-assortments';
import type { Product } from '@unchainedshop/core-products';

type HelperType<T> = (assortmentProduct: AssortmentProductType, _: never, context: Context) => T;

export interface AssortmentProductHelperTypes {
  assortment: HelperType<Promise<Assortment>>;
  product: HelperType<Promise<Product>>;
}

export const AssortmentProduct: AssortmentProductHelperTypes = {
  assortment: async (obj, _, { loaders }) => {
    const assortment = await loaders.assortmentLoader.load({
      assortmentId: obj.assortmentId,
    });
    return assortment;
  },

  product: async (obj, _, { loaders }) => {
    const product = await loaders.productLoader.load({
      productId: obj.productId,
    });
    return product;
  },
};
