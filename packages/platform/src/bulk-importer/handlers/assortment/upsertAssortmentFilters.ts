import { Context } from '@unchainedshop/types/api';
import { AssortmentFilter } from '@unchainedshop/types/assortments';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase';

const upsert = async (assortmentFilter: AssortmentFilter, { modules, userId }: Context) => {
  if (
    !(await modules.filters.filterExists({
      filterId: assortmentFilter.filterId,
    }))
  ) {
    throw new Error(`Can't link non-existing filter ${assortmentFilter.filterId}`);
  }
  try {
    const newAssortmentFilter = await modules.assortments.filters.create(assortmentFilter, userId);
    return newAssortmentFilter;
  } catch (e) {
    return modules.assortments.filters.update(assortmentFilter._id, assortmentFilter);
  }
};

export default async ({ filters, authorId, assortmentId }, unchainedAPI: Context) => {
  const { modules } = unchainedAPI;
  const assortmentFilterIds = await Promise.all(
    filters.map(async (filter: AssortmentFilter) => {
      const tags = convertTagsToLowerCase(filter?.tags);
      const assortmentFilter = await upsert(
        {
          ...filter,
          tags,
          authorId,
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
