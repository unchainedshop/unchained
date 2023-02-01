import { AssortmentFilter, AssortmentsModule } from '@unchainedshop/types/assortments';
import { Collection, Query } from '@unchainedshop/types/common';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId } from '@unchainedshop/utils';

const ASSORTMENT_FILTER_EVENTS = [
  'ASSORTMENT_ADD_FILTER',
  'ASSORTMENT_REMOVE_FILTER',
  'ASSORTMENT_REORDER_FILTERS',
];

export const configureAssortmentFiltersModule = ({
  AssortmentFilters,
}: {
  AssortmentFilters: Collection<AssortmentFilter>;
}): AssortmentsModule['filters'] => {
  registerEvents(ASSORTMENT_FILTER_EVENTS);

  return {
    findFilter: async ({ assortmentFilterId }) => {
      return AssortmentFilters.findOne(generateDbFilterById(assortmentFilterId), {});
    },

    findFilters: async ({ assortmentId }, options) => {
      const filters = AssortmentFilters.find({ assortmentId }, options);
      return filters.toArray();
    },

    findFilterIds: async ({ assortmentId }) => {
      const filters = AssortmentFilters.find(
        { assortmentId },
        {
          sort: { sortKey: 1 },
          projection: { filterId: 1 },
        },
      ).map((filter) => filter.filterId);

      return filters.toArray();
    },
    create: async (doc: AssortmentFilter, userId) => {
      const { _id, assortmentId, filterId, sortKey, ...rest } = doc;

      const selector = {
        ...(_id ? generateDbFilterById(_id) : {}),
        filterId,
        assortmentId,
      };

      const $set: any = {
        updated: new Date(),
        updatedBy: userId,
        ...rest,
      };
      const $setOnInsert: any = {
        _id: _id || generateDbObjectId(),
        filterId,
        assortmentId,
        created: new Date(),
        createdBy: userId,
      };

      if (sortKey === undefined || sortKey === null) {
        // Get next sort key
        const lastAssortmentFilter = (await AssortmentFilters.findOne(
          { assortmentId },
          { sort: { sortKey: -1 } },
        )) || { sortKey: 0 };
        $setOnInsert.sortKey = lastAssortmentFilter.sortKey + 1;
      } else {
        $set.sortKey = sortKey;
      }

      await AssortmentFilters.updateOne(
        selector,
        {
          $set,
          $setOnInsert,
        },
        { upsert: true },
      );

      const assortmentFilter = await AssortmentFilters.findOne(selector, {});

      await emit('ASSORTMENT_ADD_FILTER', { assortmentFilter });

      return assortmentFilter;
    },

    delete: async (assortmentFilterId) => {
      const selector: Query = generateDbFilterById(assortmentFilterId);

      const assortmentFilter = await AssortmentFilters.findOne(selector, {
        projection: { _id: 1 },
      });

      await AssortmentFilters.deleteOne(selector);

      await emit('ASSORTMENT_REMOVE_FILTER', {
        assortmentFilterId: assortmentFilter._id,
      });

      return [assortmentFilter];
    },

    deleteMany: async (selector) => {
      const assortmentFilters = await AssortmentFilters.find(selector, {
        projection: { _id: 1 },
      }).toArray();

      const deletionResult = await AssortmentFilters.deleteMany(selector);

      await Promise.all(
        assortmentFilters.map(async (assortmentFilter) =>
          emit('ASSORTMENT_REMOVE_FILTER', {
            assortmentFilterId: assortmentFilter._id,
          }),
        ),
      );

      return deletionResult.deletedCount;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (assortmentFilterId, doc) => {
      const selector = generateDbFilterById(assortmentFilterId);
      const modifier = { $set: doc };
      await AssortmentFilters.updateOne(selector, modifier);
      return AssortmentFilters.findOne(selector, {});
    },

    updateManualOrder: async ({ sortKeys }, userId) => {
      const changedAssortmentFilterIds = await Promise.all(
        sortKeys.map(async ({ assortmentFilterId, sortKey }) => {
          await AssortmentFilters.updateOne(generateDbFilterById(assortmentFilterId), {
            $set: {
              sortKey: sortKey + 1,
              updated: new Date(),
              updatedBy: userId,
            },
          });

          return assortmentFilterId;
        }),
      );

      const assortmentFilters = await AssortmentFilters.find({
        _id: { $in: changedAssortmentFilterIds },
      }).toArray();

      await emit('ASSORTMENT_REORDER_FILTERS', { assortmentFilters });

      return assortmentFilters;
    },
  };
};
