import { z } from 'zod';
import { createLogger } from '@unchainedshop/logger';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.ts';
import type { Modules } from '../../../modules.ts';

const logger = createLogger('unchained:bulk-importer');

export const AssortmentFilterSchema = z.object({
  _id: z.string().optional(),
  filterId: z.string(),
  tags: z.array(z.string()).optional(),
  sortKey: z.number().optional(),
  meta: z.record(z.any(), z.any()).optional(),
});

const upsert = async (
  assortmentFilter: {
    _id?: string;
    filterId: string;
    tags: string[];
    assortmentId: string;
    sortKey: number;
  },
  { modules }: { modules: Modules },
) => {
  if (
    !(await modules.filters.filterExists({
      filterId: assortmentFilter.filterId,
    }))
  ) {
    throw new Error(`Can't link non-existing filter ${assortmentFilter.filterId}`);
  }

  // Check if the assortment filter already exists
  if (assortmentFilter._id) {
    const existing = await modules.assortments.filters.findFilter({
      assortmentFilterId: assortmentFilter._id,
    });
    if (existing) {
      const updated = await modules.assortments.filters.update(assortmentFilter._id, assortmentFilter);
      logger.debug(`Updated assortment filter ${assortmentFilter._id}`);
      return updated;
    }
  }

  const newAssortmentFilter = await modules.assortments.filters.create(assortmentFilter);
  logger.debug(`Created assortment filter ${newAssortmentFilter._id}`);
  return newAssortmentFilter;
};

export default async (
  {
    filters,
    assortmentId,
  }: {
    filters: z.infer<typeof AssortmentFilterSchema>[];
    assortmentId: string;
  },
  unchainedAPI: { modules: Modules },
) => {
  const { modules } = unchainedAPI;
  const assortmentFilterIds = await Promise.all(
    filters.map(async ({ tags: tagsMixedCase, sortKey, ...rest }, forcedSortKey) => {
      const tags = tagsMixedCase ? convertTagsToLowerCase(tagsMixedCase)! : [];

      const assortmentFilter = await upsert(
        {
          ...rest,
          assortmentId,
          tags,
          sortKey: sortKey ?? forcedSortKey,
        },
        unchainedAPI,
      );
      if (!assortmentFilter) {
        throw new Error(`Failed to upsert assortment filter for assortment ${assortmentId}`);
      }
      return assortmentFilter._id;
    }),
  );

  await modules.assortments.filters.deleteMany({
    excludeIds: assortmentFilterIds,
    assortmentId,
  });
};
