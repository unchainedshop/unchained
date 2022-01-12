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
    return await modules.assortments.products.create(assortmentProduct, {
      skipInvalidation: true,
    });
  } catch (e) {
    await modules.assortments.products.update(
      assortmentProduct._id as string,
      assortmentProduct
    );
    return assortmentProduct._id as string;
  }
};

export default async (
  { products, authorId, assortmentId },
  unchainedAPI: Context
) => {
  const { modules, userId } = unchainedAPI;
  const assortmentProductIds = await Promise.all(
    products.map(async (products: AssortmentProduct) => {
      const assortmentProductId = await upsert(
        {
          ...products,
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
    { skipInvalidation: true }
  );
};
