import { AssortmentFilters } from 'meteor/unchained:core-assortments';

export default async ({ filters, authorId, assortmentId }) => {
  return Promise.all(
    filters.map(async ({ filterId, ...filtersRest }) => {
      const assortmentFilter = await AssortmentFilters.createAssortmentFilter({
        ...filtersRest,
        authorId,
        assortmentId,
        filterId,
      });
      return assortmentFilter;
    })
  );
};
