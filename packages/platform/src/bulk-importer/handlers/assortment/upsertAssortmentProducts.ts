import { Context } from '@unchainedshop/types/api';
import { AssortmentProduct } from '@unchainedshop/types/assortments';

const upsert = async (assortmentProduct: AssortmentProduct, unchainedAPI: Context) => {
  const { modules, userId } = unchainedAPI;
  if (
    !(await modules.products.productExists({
      productId: assortmentProduct.productId,
    }))
  ) {
    throw new Error(`Can't link non-existing product ${assortmentProduct.productId}`);
  }
  try {
    const newAssortmentProduct = await modules.assortments.products.create(
      assortmentProduct,
      {
        skipInvalidation: true,
      },
      userId,
    );
    return newAssortmentProduct;
  } catch (e) {
    return modules.assortments.products.update(
      assortmentProduct._id,
      assortmentProduct,
      { skipInvalidation: true },
      userId,
    );
  }
};

export default async ({ products, authorId, assortmentId }, unchainedAPI: Context) => {
  const { modules, userId } = unchainedAPI;
  const assortmentProductIds = await Promise.all(
    products.map(async (product: AssortmentProduct) => {
      const assortmentProduct = await upsert(
        {
          ...product,
          authorId,
          assortmentId,
        },
        unchainedAPI,
      );
      return assortmentProduct._id;
    }),
  );

  await modules.assortments.products.deleteMany(
    {
      _id: { $nin: assortmentProductIds },
      assortmentId,
    },
    { skipInvalidation: true },
    userId,
  );
};
