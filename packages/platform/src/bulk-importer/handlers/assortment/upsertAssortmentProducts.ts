import { Context } from '@unchainedshop/types/api';
import { AssortmentProduct } from '@unchainedshop/types/assortments';

const upsert = async (
  assortmentProduct: AssortmentProduct,
  unchainedAPI: Context
) => {
  const { modules, userId } = unchainedAPI;
  if (
    !(await modules.products.productExists({
      productId: assortmentProduct.productId,
    }))
  ) {
    throw new Error(
      `Can't link non-existing product ${assortmentProduct.productId}`
    );
  }
  try {
    return modules.assortments.products.create(
      assortmentProduct,
      {
        skipInvalidation: true,
      },
      userId
    );
  } catch (e) {
    await modules.assortments.products.update(
      assortmentProduct._id,
      assortmentProduct
    );
    return assortmentProduct._id;
  }
};

export default async (
  { products, authorId, assortmentId },
  unchainedAPI: Context
) => {
  const { modules, userId } = unchainedAPI;
  const assortmentProductIds = await Promise.all(
    products.map(async (product: AssortmentProduct) => {
      const assortmentProductId = await upsert(
        {
          ...product,
          authorId,
          assortmentId,
        },
        unchainedAPI
      );
      return assortmentProductId;
    })
  );

  await modules.assortments.products.deleteMany(
    {
      _id: { $nin: assortmentProductIds },
      assortmentId,
    },
    { skipInvalidation: true },
    userId
  );
};
