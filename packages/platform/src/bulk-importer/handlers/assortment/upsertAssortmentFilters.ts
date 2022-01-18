import { Context } from '@unchainedshop/types/api';
import { AssortmentFilter } from '@unchainedshop/types/assortments';

const upsert = async (
  assortmentFilter: AssortmentFilter,
  { modules, userId }: Context
) => {
  if (
    !(await modules.filters.filterExists({
      filterId: assortmentFilter.filterId,
    }))
  ) {
    throw new Error(
      `Can't link non-existing filter ${assortmentFilter.filterId}`
    );
  }
  try {
    return await modules.assortments.filters.create(assortmentFilter, userId);
  } catch (e) {
    return await modules.assortments.filters.update(
      assortmentFilter._id,
      assortmentFilter
    );
  }
};

export default async (
  { filters, authorId, assortmentId },
  unchainedAPI: Context
) => {
  const { modules, userId } = unchainedAPI;
  const assortmentFilterIds = await Promise.all(
    filters.map(async (filter: AssortmentFilter) => {
      const assortmentFilter = await upsert(
        {
          ...filter,
          authorId,
          assortmentId,
        },
        unchainedAPI
      );
      return assortmentFilter._id;
    })
  );

  await modules.assortments.filters.deleteMany({
    _id: { $nin: assortmentFilterIds },
    assortmentId,
  });
};
