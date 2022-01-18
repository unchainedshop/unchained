import { ProductAssortmentPathHelperTypes } from '@unchainedshop/types/products';

export const ProductAssortmentPath: ProductAssortmentPathHelperTypes = {
  assortmentProduct: async ({ _id }, _, { modules }) => {
    return await modules.assortments.products.findProduct({
      assortmentProductId: _id,
    });
  },
};
