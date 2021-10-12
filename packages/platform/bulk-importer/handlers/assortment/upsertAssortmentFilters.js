import { AssortmentFilters } from 'meteor/unchained:core-assortments';
import { Filters } from 'meteor/unchained:core-filters';

const upsert = async ({ _id, ...entityData }) => {
  if (!Filters.filterExists({ filterId: entityData.filterId })) {
    throw new Error(`Can't link non-existing filter ${entityData.filterId}`);
  }
  try {
    return AssortmentFilters.createAssortmentFilter(
      { _id, ...entityData },
      { skipInvalidation: true }
    );
  } catch (e) {
    AssortmentFilters.update({ _id }, { $set: entityData });
    return AssortmentFilters.findOne({ _id });
  }
};

export default async ({ filters, authorId, assortmentId }) => {
  const assortmentFilterIds = await Promise.all(
    filters.map(async ({ filterId, ...filtersRest }) => {
      const assortmentFilter = await upsert({
        ...filtersRest,
        authorId,
        assortmentId,
        filterId,
      });
      return assortmentFilter._id;
    })
  );

  AssortmentFilters.removeFilters(
    {
      _id: { $nin: assortmentFilterIds },
      assortmentId,
    },
    { skipInvalidation: true }
  );
};
