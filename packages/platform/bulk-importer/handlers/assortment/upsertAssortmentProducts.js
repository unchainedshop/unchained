import { AssortmentProducts } from 'meteor/unchained:core-assortments';

const upsert = async ({ _id, ...entityData }) => {
  try {
    return AssortmentProducts.createAssortmentProduct({ _id, ...entityData });
  } catch (e) {
    AssortmentProducts.update({ _id }, { $set: entityData });
    return AssortmentProducts.findOne({ _id });
  }
};

export default async ({ products, authorId, assortmentId }) => {
  const assortmentProductIds = await Promise.all(
    products.map(async ({ productId, ...productsRest }) => {
      const assortmentProduct = await upsert({
        ...productsRest,
        authorId,
        assortmentId,
        productId,
      });
      return assortmentProduct._id;
    })
  );

  AssortmentProducts.remove({
    _id: { $nin: assortmentProductIds },
    assortmentId,
  });
};
