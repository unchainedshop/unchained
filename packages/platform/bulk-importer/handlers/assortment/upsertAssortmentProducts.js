import { AssortmentProducts } from 'meteor/unchained:core-assortments';

export default async ({ products, authorId, assortmentId }) => {
  const assortmentProductIds = await Promise.all(
    products.map(async ({ productId, ...productsRest }) => {
      const assortmentProduct = await AssortmentProducts.createAssortmentProduct(
        {
          ...productsRest,
          authorId,
          assortmentId,
          productId,
        }
      );
      return assortmentProduct._id;
    })
  );

  AssortmentProducts.remove({
    _id: { $nin: assortmentProductIds },
    assortmentId,
  });
};
