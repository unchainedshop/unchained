import { z } from 'zod';
import { AssortmentProduct } from '@unchainedshop/core-assortments';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';
import { Modules } from '../../../modules.js';

export const AssortmentProductSchema = z.object({
  _id: z.string().optional(),
  productId: z.string(),
  tags: z.array(z.string()).optional(),
  sortKey: z.number().optional(),
});

const upsert = async (assortmentProduct: AssortmentProduct, unchainedAPI: { modules: Modules }) => {
  const { modules } = unchainedAPI;
  if (
    !(await modules.products.productExists({
      productId: assortmentProduct.productId,
    }))
  ) {
    throw new Error(`Can't link non-existing product ${assortmentProduct.productId}`);
  }
  try {
    const newAssortmentProduct = (await modules.assortments.products.create(assortmentProduct, {
      skipInvalidation: true,
    })) as AssortmentProduct;
    return newAssortmentProduct;
  } catch {
    return (await modules.assortments.products.update(assortmentProduct._id, assortmentProduct, {
      skipInvalidation: true,
    })) as AssortmentProduct;
  }
};

export default async ({ products, assortmentId }, unchainedAPI: { modules: Modules }) => {
  const { modules } = unchainedAPI;
  const assortmentProductIds = await Promise.all(
    products.map(async (product: AssortmentProduct) => {
      const adjustedProduct = { ...product };
      if (adjustedProduct.tags) {
        adjustedProduct.tags = convertTagsToLowerCase(adjustedProduct.tags) as string[];
      }
      const assortmentProduct = await upsert(
        {
          ...adjustedProduct,
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
  );
};
