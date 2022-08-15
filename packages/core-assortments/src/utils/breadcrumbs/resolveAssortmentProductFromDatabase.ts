import { AssortmentProduct } from '@unchainedshop/types/assortments';
import { Filter, Collection } from '@unchainedshop/types/common';

export function resolveAssortmentProductFromDatabase(
  AssortmentProducts: Collection<AssortmentProduct>,
  selector: Filter<AssortmentProduct> = {},
) {
  return async (productId: string) => {
    const products = AssortmentProducts.find(
      { productId, ...selector },
      {
        projection: { _id: true, assortmentId: true },
        sort: { sortKey: 1, productId: 1 },
      },
    );

    return products.toArray();
  };
}
