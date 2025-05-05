import { emit, registerEvents } from '@unchainedshop/events';
import { SortDirection, SortOption } from '@unchainedshop/utils';
import {
  mongodb,
  generateDbFilterById,
  buildSortOptions,
  generateDbObjectId,
  ModuleInput,
  assertDocumentDBCompatMode,
} from '@unchainedshop/mongodb';
import { Filter, FiltersCollection, FilterType } from '../db/FiltersCollection.js';
import { configureFilterTextsModule } from './configureFilterTextsModule.js';
import createFilterValueParser from '../filter-value-parsers/index.js';
import { filtersSettings, FiltersSettingsOptions } from '../filters-settings.js';
import { FilterQuery } from '../search.js';

export type FilterOption = Filter & {
  filterOption: string;
};

const FILTER_EVENTS = ['FILTER_CREATE', 'FILTER_REMOVE', 'FILTER_UPDATE'];

export const buildFindSelector = ({
  includeInactive = false,
  queryString,
  filterIds,
  ...query
}: FilterQuery) => {
  const selector: mongodb.Filter<Filter> = { ...query };
  if (!includeInactive) selector.isActive = true;
  if (filterIds) {
    selector._id = { $in: filterIds };
  }
  if (queryString) {
    assertDocumentDBCompatMode();
    (selector as any).$text = { $search: queryString };
  }
  return selector;
};

export const configureFiltersModule = async ({
  db,
  options: filtersOptions = {},
}: ModuleInput<FiltersSettingsOptions>) => {
  registerEvents(FILTER_EVENTS);

  // Settings
  await filtersSettings.configureSettings(filtersOptions, db);

  const { Filters, FilterTexts } = await FiltersCollection(db);

  const filterTexts = configureFilterTextsModule({
    FilterTexts,
  });

  /*
   * Filter
   */

  return {
    // Queries
    findFilter: async ({ filterId, key }: { filterId?: string; key?: string }): Promise<Filter> => {
      if (key) {
        return Filters.findOne({ key }, {});
      }
      return Filters.findOne(generateDbFilterById(filterId), {});
    },

    findFilters: async (
      {
        limit,
        offset,
        sort,
        ...query
      }: FilterQuery & {
        limit?: number;
        offset?: number;
        sort?: SortOption[];
      } & mongodb.Filter<Filter>,
      options?: mongodb.FindOptions<Filter>,
    ): Promise<Filter[]> => {
      const defaultSortOption = [{ key: 'created', value: SortDirection.ASC }];
      const filters = Filters.find(buildFindSelector(query), {
        ...options,
        skip: offset,
        limit,
        sort: buildSortOptions(sort || defaultSortOption),
      });
      return filters.toArray();
    },

    count: async (query: FilterQuery): Promise<number> => {
      const count = await Filters.countDocuments(buildFindSelector(query));
      return count;
    },

    filterExists: async ({ filterId }: { filterId: string }) => {
      const filterCount = await Filters.countDocuments(generateDbFilterById(filterId), {
        limit: 1,
      });
      return !!filterCount;
    },

    // Mutations
    create: async ({ type, isActive = false, ...filterData }: Filter): Promise<Filter> => {
      const { insertedId: filterId } = await Filters.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        isActive,
        type: FilterType[type],
        ...filterData,
      });

      const filter = await Filters.findOne(generateDbFilterById(filterId), {});

      await emit('FILTER_CREATE', { filter });
      return filter;
    },

    parse: (filter: Filter, values: any[], allKeys: string[]) => {
      const parse = createFilterValueParser(filter.type);
      // const keys = parse(values, Object.keys(productIds));
      return parse(values, allKeys);
    },

    createFilterOption: async (filterId: string, { value }: { value: string }): Promise<Filter> => {
      const selector = generateDbFilterById(filterId);
      const filter = await Filters.findOneAndUpdate(
        selector,
        {
          $set: {
            updated: new Date(),
          },
          $addToSet: {
            options: value,
          },
        },
        { returnDocument: 'after' },
      );

      await emit('FILTER_UPDATE', { filterId, options: filter.options, updated: filter.updated });

      return filter;
    },

    delete: async (filterId: string) => {
      await filterTexts.deleteMany({ filterId });
      const { deletedCount } = await Filters.deleteOne({ _id: filterId });
      await emit('FILTER_REMOVE', { filterId });
      return deletedCount;
    },

    removeFilterOption: async ({
      filterId,
      filterOptionValue,
    }: {
      filterId: string;
      filterOptionValue?: string;
    }): Promise<Filter> => {
      const selector = generateDbFilterById(filterId);
      const filter = await Filters.findOneAndUpdate(
        selector,
        {
          $set: {
            updated: new Date(),
          },
          $pull: {
            options: filterOptionValue,
          },
        },
        { returnDocument: 'after' },
      );

      await emit('FILTER_UPDATE', { filterId, options: filter.options, updated: filter.updated });

      return filter;
    },

    update: async (filterId: string, doc: Filter): Promise<Filter> => {
      const filter = await Filters.findOneAndUpdate(
        generateDbFilterById(filterId),
        {
          $set: {
            updated: new Date(),
            ...doc,
          },
        },
        { returnDocument: 'after' },
      );

      if (filter) {
        await emit('FILTER_UPDATE', { filterId: filter._id, ...filter });
      }

      return filter;
    },

    texts: filterTexts,
  };
};

export type FiltersModule = Awaited<ReturnType<typeof configureFiltersModule>>;
