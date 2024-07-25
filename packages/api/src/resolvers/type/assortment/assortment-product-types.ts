import { Context } from '@unchainedshop/api';
import {
  Assortment,
  AssortmentProduct as AssortmentProductType,
} from '@unchainedshop/types/assortments.js';
import { Product } from '@unchainedshop/types/products.js';

type HelperType<T> = (assortmentProduct: AssortmentProductType, _: never, context: Context) => T;

export type AssortmentProductHelperTypes = {
  assortment: HelperType<Promise<Assortment>>;
  product: HelperType<Promise<Product>>;
};

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
