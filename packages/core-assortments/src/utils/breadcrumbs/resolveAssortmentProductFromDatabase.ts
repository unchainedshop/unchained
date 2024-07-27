import { mongodb } from '@unchainedshop/mongodb';
import { AssortmentProduct } from '../../types.js';

export function resolveAssortmentProductFromDatabase(
  AssortmentProducts: mongodb.Collection<AssortmentProduct>,
  selector: mongodb.Filter<AssortmentProduct> = {},
) {
  return async (productId: string) => {
    const assortmentProducts = AssortmentProducts.find(
      { productId, ...selector },
      {
        projection: { _id: true, assortmentId: true, productId: true },
        sort: { sortKey: 1, productId: 1 },
      },
    );

    return assortmentProducts.toArray();
  };
}
