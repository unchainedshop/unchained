import {
  AssortmentFilter,
  AssortmentsModule,
} from '@unchainedshop/types/assortments';
import { Collection, Filter } from '@unchainedshop/types/common';
import { emit, registerEvents } from 'meteor/unchained:director-events';
import { generateDbFilterById, generateId } from 'meteor/unchained:utils';

const ASSORTMENT_FILTER_EVENTS = [
  'ASSORTMENT_ADD_FILTER',
  'ASSORTMENT_REMOVE_FILTER',
  'ASSORTMENT_REORDER_FILTERS',
];

export const configureAssortmentsModule = async ({
  AssortmentFilters,
}: {
  AssortmentFilters: Collection<AssortmentFilter>;
}): Promise<AssortmentsModule['filters']> => {
  registerEvents(ASSORTMENT_FILTER_EVENTS);

  return {
    findFilter: async ({ assortmentFilterId }) => {
      return await AssortmentFilters.findOne(
        generateDbFilterById(assortmentFilterId)
      );
    },

    findFilters: async ({ assortmentId }, options) => {
      const filters = AssortmentFilters.find({ assortmentId }, options);
      return await filters.toArray();
    },

    create: async (doc: AssortmentFilter, userId) => {
      const { assortmentId, filterId, ...rest } = doc;

      const selector = {
        ...(doc._id ? generateDbFilterById(doc._id) : {}),
        filterId,
        assortmentId,
      };

      const $set: any = {
        updated: new Date(),
        updatedBy: userId,
        ...rest,
      };
      const $setOnInsert: any = {
        filterId,
        assortmentId,
        created: new Date(),
        createdBy: userId,
      };

      if (!doc.sortKey) {
        // Get next sort key
        const lastAssortmentFilter = (await AssortmentFilters.findOne(
          { assortmentId },
          { sort: { sortKey: -1 } }
        )) || { sortKey: 0 };
        $setOnInsert.sortKey = lastAssortmentFilter.sortKey + 1;
      } else {
        $set.sortKey = doc.sortKey;
      }

      await AssortmentFilters.updateOne(selector, {
        $set,
        $setOnInsert,
      });

      const assortmentFilter = await AssortmentFilters.findOne(selector);

      emit('ASSORTMENT_ADD_FILTER', { assortmentFilter });

      return assortmentFilter;
    },

    delete: async (assortmentFilterId) => {
      const selector: Filter<AssortmentFilter> =
        generateDbFilterById(assortmentFilterId);

      const assortmentFilter = await AssortmentFilters.findOne(selector, {
        projection: { _id: 1 },
      });

      AssortmentFilters.deleteOne(selector);

      emit('ASSORTMENT_REMOVE_FILTER', {
        assortmentFilterId: assortmentFilter._id,
      });

      return [assortmentFilter];
    },

    deleteMany: async (selector) => {
      const assortmentFilters = await AssortmentFilters.find(selector, {
        projection: { _id: 1 },
      }).toArray();

      AssortmentFilters.deleteMany(selector);

      assortmentFilters.forEach((assortmentFilter) => {
        emit('ASSORTMENT_REMOVE_FILTER', {
          assortmentFilterId: assortmentFilter._id,
        });
      });

      return assortmentFilters;
    },

    updateManualOrder: async ({ sortKeys }, userId) => {
      const changedAssortmentFilterIds = await Promise.all(
        sortKeys.map(async ({ assortmentFilterId, sortKey }) => {
          await AssortmentFilters.updateOne(
            generateDbFilterById(assortmentFilterId),
            {
              $set: {
                sortKey: sortKey + 1,
                updated: new Date(),
                updatedBy: userId,
              },
            }
          );

          return generateId(assortmentFilterId);
        })
      );

      const assortmentFilters = await AssortmentFilters.find({
        _id: { $in: changedAssortmentFilterIds },
      }).toArray();

      emit('ASSORTMENT_REORDER_FILTERS', { assortmentFilters });

      return assortmentFilters;
    },
  };
};
