import { z } from 'zod';
import { AssortmentFilter } from '@unchainedshop/core-assortments';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';
import { Modules } from '../../../modules.js';

export const AssortmentFilterSchema = z.object({
  _id: z.string().optional(),
  filterId: z.string(),
  tags: z.array(z.string()).optional(),
  sortKey: z.number().optional(),
});

const upsert = async (assortmentFilter: AssortmentFilter, { modules }: { modules: Modules }) => {
  if (
    !(await modules.filters.filterExists({
      filterId: assortmentFilter.filterId,
    }))
  ) {
    throw new Error(`Can't link non-existing filter ${assortmentFilter.filterId}`);
  }
  try {
    const newAssortmentFilter = (await modules.assortments.filters.create(
      assortmentFilter,
    )) as AssortmentFilter;
    return newAssortmentFilter;
  } catch {
    return (await modules.assortments.filters.update(
      assortmentFilter._id,
      assortmentFilter,
    )) as AssortmentFilter;
  }
};

export default async ({ filters, assortmentId }, unchainedAPI: { modules: Modules }) => {
  const { modules } = unchainedAPI;
  const assortmentFilterIds = await Promise.all(
    filters.map(async (filter: AssortmentFilter) => {
      const adjustedFilter = { ...filter };
      if (adjustedFilter.tags) {
        adjustedFilter.tags = convertTagsToLowerCase(adjustedFilter.tags) as string[];
      }
      const assortmentFilter = await upsert(
        {
          ...adjustedFilter,
          assortmentId,
        },
        unchainedAPI,
      );
      return assortmentFilter._id;
    }),
  );

  await modules.assortments.filters.deleteMany({
    _id: { $nin: assortmentFilterIds },
    assortmentId,
  });
};
