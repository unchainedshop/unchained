import { z } from 'zod';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';
import { Modules } from '../../../modules.js';

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
  try {
    const newAssortmentFilter = await modules.assortments.filters.create(assortmentFilter);
    return newAssortmentFilter;
  } catch {
    return await modules.assortments.filters.update(assortmentFilter._id!, assortmentFilter);
  }
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
      return assortmentFilter!._id;
    }),
  );

  await modules.assortments.filters.deleteMany({
    _id: { $nin: assortmentFilterIds },
    assortmentId,
  });
};
