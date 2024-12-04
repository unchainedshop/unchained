import memoizee from 'memoizee';
import { emit, registerEvents } from '@unchainedshop/events';
import { log, LogLevel } from '@unchainedshop/logger';
import { SortDirection, SortOption } from '@unchainedshop/utils';
import {
  mongodb,
  generateDbFilterById,
  buildSortOptions,
  generateDbObjectId,
  ModuleInput,
} from '@unchainedshop/mongodb';
import { FilterDirector } from '../director/FilterDirector.js';
import { Filter, FiltersCollection, FilterType } from '../db/FiltersCollection.js';
import { configureFilterTextsModule } from './configureFilterTextsModule.js';
import createFilterValueParser from '../filter-value-parsers/index.js';
import { filtersSettings, FiltersSettingsOptions } from '../filters-settings.js';
import { CleanedSearchQuery, FilterQuery, SearchQuery } from '../search/search.js';
import { parseQueryArray } from '../utils/parseQueryArray.js';

export type FilterOption = Filter & {
  filterOption: string;
};

const FILTER_EVENTS = ['FILTER_CREATE', 'FILTER_REMOVE', 'FILTER_UPDATE'];

const buildFindSelector = ({
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
  if (queryString) (selector as any).$text = { $search: queryString };
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

  const findProductIds = async (
    filter: Filter,
    { value }: { value?: boolean | string },
    unchainedAPI,
  ) => {
    const { modules } = unchainedAPI;
    const director = await FilterDirector.actions({ filter, searchQuery: {} }, unchainedAPI);
    const productSelector = await director.transformProductSelector(
      modules.products.search.buildActiveDraftStatusFilter(),
      {
        key: filter.key,
        value,
      },
    );

    if (!productSelector) return [];
    return modules.products.findProductIds({
      productSelector,
      includeDrafts: true,
    });
  };

  const buildProductIdMap = async (
    filter: Filter,
    unchainedAPI,
  ): Promise<[Array<string>, Record<string, Array<string>>]> => {
    const allProductIds = await findProductIds(filter, {}, unchainedAPI);
    const productIdsMap =
      filter.type === FilterType.SWITCH
        ? {
            true: await findProductIds(filter, { value: true }, unchainedAPI),
            false: await findProductIds(filter, { value: false }, unchainedAPI),
          }
        : await (filter.options || []).reduce(async (accumulatorPromise, option) => {
            const accumulator = await accumulatorPromise;
            return {
              ...accumulator,
              [option]: await findProductIds(filter, { value: option }, unchainedAPI),
            };
          }, Promise.resolve({}));

    return [allProductIds, productIdsMap];
  };

  const filterProductIds = memoizee(
    async function filterProductIdsRaw(
      filter: Filter,
      { values, forceLiveCollection }: { values: Array<string>; forceLiveCollection?: boolean },
      unchainedAPI,
    ) {
      const getProductIds =
        (!forceLiveCollection && (await filtersSettings.getCachedProductIds(filter._id))) ||
        (await buildProductIdMap(filter, unchainedAPI));

      const [allProductIds, productIds] = getProductIds;
      const parse = createFilterValueParser(filter.type);

      return parse(values, Object.keys(productIds)).reduce((accumulator, value) => {
        const additionalValues = value === undefined ? allProductIds : productIds[value];
        return [...accumulator, ...(additionalValues || [])];
      }, []);
    },
    {
      maxAge: 5000,
      promise: true,
      normalizer(args) {
        // args is arguments object as accessible in memoized function
        return `${args[0]._id}-${args[1].values?.toString()}`;
      },
    },
  );

  const invalidateProductIdCache = async (filter: Filter, unchainedAPI) => {
    if (!filter) return;

    log(`Filters: Rebuilding ${filter.key}`, { level: LogLevel.Verbose });

    const [productIds, productIdMap] = await buildProductIdMap(filter, unchainedAPI);
    await filtersSettings.setCachedProductIds(filter._id, productIds, productIdMap);
  };

  const invalidateCache = async (selector: mongodb.Filter<Filter>, unchainedAPI): Promise<void> => {
    log('Filters: Start invalidating filter caches', {
      level: LogLevel.Verbose,
    });

    const filters = await Filters.find(selector || {}).toArray();
    await filters.reduce(async (lastPromise, filter) => {
      await lastPromise;
      return invalidateProductIdCache(filter, unchainedAPI);
    }, Promise.resolve(undefined));
    filterProductIds.clear();
  };

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
        sort?: Array<SortOption>;
      } & mongodb.Filter<Filter>,
      options?: mongodb.FindOptions<Filter>,
    ): Promise<Array<Filter>> => {
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

    invalidateCache,

    // Mutations
    create: async (
      { type, isActive = false, ...filterData }: Filter & { title: string; locale: string },
      unchainedAPI,
      options?: { skipInvalidation?: boolean },
    ): Promise<Filter> => {
      const { insertedId: filterId } = await Filters.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        isActive,
        type: FilterType[type],
        ...filterData,
      });

      const filter = await Filters.findOne(generateDbFilterById(filterId), {});
      if (!options?.skipInvalidation) {
        await invalidateProductIdCache(filter, unchainedAPI);
        filterProductIds.clear();
      }

      await emit('FILTER_CREATE', { filter });
      return filter;
    },

    createFilterOption: async (
      filterId: string,
      { value }: { value: string },
      unchainedAPI,
    ): Promise<Filter> => {
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

      await invalidateProductIdCache(filter, unchainedAPI);
      filterProductIds.clear();

      await emit('FILTER_UPDATE', { filterId, options: filter.options, updated: filter.updated });

      return filter;
    },

    delete: async (filterId: string) => {
      await filterTexts.deleteMany({ filterId });
      const { deletedCount } = await Filters.deleteOne({ _id: filterId });
      await emit('FILTER_REMOVE', { filterId });
      return deletedCount;
    },

    removeFilterOption: async (
      {
        filterId,
        filterOptionValue,
      }: {
        filterId: string;
        filterOptionValue?: string;
      },
      unchainedAPI,
    ): Promise<Filter> => {
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

      await invalidateProductIdCache(filter, unchainedAPI);
      filterProductIds.clear();

      await emit('FILTER_UPDATE', { filterId, options: filter.options, updated: filter.updated });

      return filter;
    },

    update: async (
      filterId: string,
      doc: Filter,
      unchainedAPI,
      options?: { skipInvalidation?: boolean },
    ): Promise<Filter> => {
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
        if (!options?.skipInvalidation) {
          await invalidateProductIdCache(filter, unchainedAPI);
          filterProductIds.clear();
        }
        await emit('FILTER_UPDATE', { filterId: filter._id, ...filter });
      }

      return filter;
    },

    cleanQuery: ({ filterQuery, ...query }: SearchQuery) =>
      ({
        filterQuery: parseQueryArray(filterQuery),
        ...query,
      }) as CleanedSearchQuery,

    filterProductIds,

    texts: filterTexts,
  };
};

export type FiltersModule = Awaited<ReturnType<typeof configureFiltersModule>>;
