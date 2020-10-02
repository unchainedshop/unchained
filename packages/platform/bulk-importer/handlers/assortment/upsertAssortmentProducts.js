import { AssortmentProducts } from 'meteor/unchained:core-assortments';

export default async ({ products, authorId, assortmentId }) => {
  return Promise.all(
    products.map(async ({ productId, ...productsRest }) => {
      const assortmentProduct = await AssortmentProducts.createAssortmentProduct(
        {
          ...productsRest,
          authorId,
          assortmentId,
          productId,
        }
      );
      return assortmentProduct;
    })
  );
};
