import { ProductAssortmentPathHelperTypes } from '@unchainedshop/types/products.js';

export const ProductAssortmentPath: ProductAssortmentPathHelperTypes = {
  assortmentProduct: async ({ assortmentId, productId }, _, { loaders }) => {
    return loaders.assortmentProductLoader.load({
      assortmentId,
      productId,
    });
  },
};
