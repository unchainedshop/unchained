import { AssortmentFilters } from 'meteor/unchained:core-assortments';

export default async ({ filters, authorId, assortmentId }) => {
  const assortmentFilterIds = await Promise.all(
    filters.map(async ({ filterId, ...filtersRest }) => {
      const assortmentFilter = await AssortmentFilters.createAssortmentFilter({
        ...filtersRest,
        authorId,
        assortmentId,
        filterId,
      });
      return assortmentFilter._id;
    })
  );

  AssortmentFilters.remove({
    _id: { $nin: assortmentFilterIds },
    assortmentId,
  });
};
