import { AssortmentProduct } from '@unchainedshop/types/assortments';
import { Collection, QuerySelector } from 'mongodb';

export function resolveAssortmentProductFromDatabase(
  AssortmentProducts: Collection<AssortmentProduct>,
  selector: QuerySelector<AssortmentProduct> = {},
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
