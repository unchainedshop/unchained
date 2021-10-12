import { AssortmentFilters } from 'meteor/unchained:core-assortments';

const upsert = async ({ _id, ...entityData }) => {
  try {
    return AssortmentFilters.createAssortmentFilter({ _id, ...entityData });
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
