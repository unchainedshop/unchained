import { AssortmentFilter } from '@unchainedshop/core-assortments';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';
import { Modules } from '../../../modules.js';

const upsert = async (assortmentFilter: AssortmentFilter, { modules }: { modules: Modules }) => {
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
    return modules.assortments.filters.update(assortmentFilter._id, assortmentFilter);
  }
};

export default async ({ filters, assortmentId }, unchainedAPI: { modules: Modules }) => {
  const { modules } = unchainedAPI;
  const assortmentFilterIds = await Promise.all(
    filters.map(async (filter: AssortmentFilter) => {
      const tags = convertTagsToLowerCase(filter?.tags);
      const assortmentFilter = await upsert(
        {
          ...filter,
          tags,
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
