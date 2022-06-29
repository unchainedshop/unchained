import { Context } from '@unchainedshop/types/api';
import {
  Assortment,
  AssortmentProduct as AssortmentProductType,
} from '@unchainedshop/types/assortments';
import { Product } from '@unchainedshop/types/products';

type HelperType<T> = (assortmentProduct: AssortmentProductType, _: never, context: Context) => T;

type AssortmentProductHelperTypes = {
  assortment: HelperType<Promise<Assortment>>;
  product: HelperType<Promise<Product>>;
};

export const AssortmentProduct: AssortmentProductHelperTypes = {
  assortment: (obj, _, { modules }) =>
    modules.assortments.findAssortment({
      assortmentId: obj.assortmentId,
    }),

  product: (obj, _, { modules }) =>
    modules.products.findProduct({
      productId: obj.productId,
    }),
};
