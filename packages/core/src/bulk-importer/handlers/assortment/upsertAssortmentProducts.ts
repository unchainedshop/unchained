import { z } from 'zod/v4-mini';
import type { AssortmentProduct } from '@unchainedshop/core-assortments';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.ts';
import type { Modules } from '../../../modules.ts';

export const AssortmentProductSchema = z.object({
  _id: z.optional(z.string()),
  productId: z.string(),
  tags: z.optional(z.array(z.string())),
  sortKey: z.optional(z.number()),
  meta: z.optional(z.record(z.any(), z.any())),
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
