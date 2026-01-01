import { z } from 'zod';
import { createLogger } from '@unchainedshop/logger';
import type { AssortmentProduct } from '@unchainedshop/core-assortments';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.ts';
import type { Modules } from '../../../modules.ts';

const logger = createLogger('unchained:bulk-importer');

export const AssortmentProductSchema = z.object({
  _id: z.string().optional(),
  productId: z.string(),
  tags: z.array(z.string()).optional(),
  sortKey: z.number().optional(),
  meta: z.record(z.any(), z.any()).optional(),
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
): Promise<AssortmentProduct> => {
  const { modules } = unchainedAPI;
  if (
    !(await modules.products.productExists({
      productId: assortmentProduct.productId,
    }))
  ) {
    throw new Error(`Can't link non-existing product ${assortmentProduct.productId}`);
  }

  // Check if the assortment product already exists
  if (assortmentProduct._id) {
    const existing = await modules.assortments.products.findAssortmentProduct({
      assortmentProductId: assortmentProduct._id,
    });
    if (existing) {
      const updated = await modules.assortments.products.update(
        assortmentProduct._id,
        assortmentProduct,
        { skipInvalidation: true },
      );
      if (!updated) {
        throw new Error(`Failed to update assortment product ${assortmentProduct._id}`);
      }
      logger.debug(`Updated assortment product ${assortmentProduct._id}`);
      return updated as AssortmentProduct;
    }
  }

  const newAssortmentProduct = await modules.assortments.products.create(assortmentProduct, {
    skipInvalidation: true,
  });
  if (!newAssortmentProduct) {
    throw new Error(`Failed to create assortment product`);
  }
  logger.debug(`Created assortment product ${newAssortmentProduct._id}`);
  return newAssortmentProduct as AssortmentProduct;
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
      excludeIds: assortmentProductIds,
      assortmentId,
    },
    { skipInvalidation: true },
  );
};
