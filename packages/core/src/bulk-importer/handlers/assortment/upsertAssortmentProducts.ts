import { z } from 'zod';
import { AssortmentProduct } from '@unchainedshop/core-assortments';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';
import { Modules } from '../../../modules.js';

export const AssortmentProductSchema = z.object({
  _id: z.string().optional(),
  productId: z.string(),
  tags: z.array(z.string()).optional(),
  sortKey: z.number().optional(),
  meta: z.record(z.any()).optional(),
});

const upsert = async (
  assortmentProduct: {
    _id?: string;
    productId: string;
    tags: string[];
    assortmentId: string;
    sortKey: number;
  },
  unchainedAPI: { modules: Modules },
) => {
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
    return (await modules.assortments.products.update(assortmentProduct._id!, assortmentProduct, {
      skipInvalidation: true,
    })) as AssortmentProduct;
  }
};

export default async (
  {
    products,
    assortmentId,
  }: { products: z.infer<typeof AssortmentProductSchema>[]; assortmentId: string },
  unchainedAPI: { modules: Modules },
) => {
  const { modules } = unchainedAPI;
  const assortmentProductIds = await Promise.all(
    products.map(async ({ tags: tagsMixedCase, sortKey, ...rest }, forcedSortKey) => {
      const tags = tagsMixedCase ? convertTagsToLowerCase(tagsMixedCase)! : [];

      const assortmentProduct = await upsert(
        {
          ...rest,
          tags,
          sortKey: sortKey ?? forcedSortKey,
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
