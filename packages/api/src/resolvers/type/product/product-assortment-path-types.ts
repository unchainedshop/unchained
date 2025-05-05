import { Product } from '@unchainedshop/core-products';
import { Context } from '../../../context.js';
import { AssortmentPathLink, AssortmentProduct } from '@unchainedshop/core-assortments';

export type HelperType<P, T> = (product: Product, params: P, context: Context) => T;
export interface ProductAssortmentPathHelperTypes {
  assortmentProduct: (
    data: { assortmentId: string; productId: string; links: AssortmentPathLink[] },
    _: never,
    context: Context,
  ) => Promise<AssortmentProduct>;
}

export const ProductAssortmentPath: ProductAssortmentPathHelperTypes = {
  assortmentProduct: async ({ assortmentId, productId }, _, { loaders }) => {
    return loaders.assortmentProductLoader.load({
      assortmentId,
      productId,
    });
  },
};
