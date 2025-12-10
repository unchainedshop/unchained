import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { type AssortmentFilter } from '../db/AssortmentsCollection.ts';

const ASSORTMENT_FILTER_EVENTS = [
  'ASSORTMENT_ADD_FILTER',
  'ASSORTMENT_REMOVE_FILTER',
  'ASSORTMENT_REORDER_FILTERS',
];

export const configureAssortmentFiltersModule = ({
  AssortmentFilters,
}: {
  AssortmentFilters: mongodb.Collection<AssortmentFilter>;
}) => {
  registerEvents(ASSORTMENT_FILTER_EVENTS);

  return {
    findFilter: async ({ assortmentFilterId }: { assortmentFilterId: string }) => {
      return AssortmentFilters.findOne(generateDbFilterById(assortmentFilterId), {});
    },

    findFilters: async (
      {
        assortmentId,
      }: {
        assortmentId: string;
      },
      options?: mongodb.FindOptions,
    ): Promise<AssortmentFilter[]> => {
      const filters = AssortmentFilters.find({ assortmentId }, options);
      return filters.toArray();
    },

    findFilterIds: async ({ assortmentId }: { assortmentId: string }): Promise<string[]> => {
      const filters = AssortmentFilters.find(
        { assortmentId },
        {
          sort: { sortKey: 1 },
          projection: { filterId: 1 },
        },
      ).map((filter) => filter.filterId);

      return filters.toArray();
    },
    create: async (
      doc: Omit<AssortmentFilter, '_id' | 'created' | 'sortKey'> &
        Pick<Partial<AssortmentFilter>, '_id' | 'created' | 'sortKey'>,
    ) => {
      const { _id, assortmentId, filterId, sortKey, ...rest } = doc;

      const selector = {
        ...(_id ? generateDbFilterById(_id) : {}),
        filterId,
        assortmentId,
      };

      const $set: any = {
        updated: new Date(),
        ...rest,
      };
      const $setOnInsert: any = {
        _id: _id || generateDbObjectId(),
        filterId,
        assortmentId,
        created: new Date(),
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

      const assortmentFilter = await AssortmentFilters.findOneAndUpdate(
        selector,
        {
          $set,
          $setOnInsert,
        },
        { upsert: true, returnDocument: 'after' },
      );

      await emit('ASSORTMENT_ADD_FILTER', { assortmentFilter });

      return assortmentFilter;
    },

    delete: async (assortmentFilterId: string) => {
      const selector: mongodb.Filter<AssortmentFilter> = generateDbFilterById(assortmentFilterId);

      const assortmentFilter = await AssortmentFilters.findOneAndDelete(selector);
      if (!assortmentFilter) return null;

      await emit('ASSORTMENT_REMOVE_FILTER', {
        assortmentFilterId: assortmentFilter._id,
      });

      return assortmentFilter;
    },

    deleteMany: async (selector: mongodb.Filter<AssortmentFilter>): Promise<number> => {
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
    update: async (assortmentFilterId: string, doc: Partial<AssortmentFilter>) => {
      const selector = generateDbFilterById(assortmentFilterId);
      const modifier = { $set: doc };

      return AssortmentFilters.findOneAndUpdate(selector, modifier, {
        returnDocument: 'after',
      });
    },

    updateManualOrder: async ({
      sortKeys,
    }: {
      sortKeys: {
        assortmentFilterId: string;
        sortKey: number;
      }[];
    }): Promise<AssortmentFilter[]> => {
      const changedAssortmentFilterIds = await Promise.all(
        sortKeys.map(async ({ assortmentFilterId, sortKey }) => {
          await AssortmentFilters.updateOne(generateDbFilterById(assortmentFilterId), {
            $set: {
              sortKey: sortKey + 1,
              updated: new Date(),
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

export type AssortmentFiltersModule = ReturnType<typeof configureAssortmentFiltersModule>;
