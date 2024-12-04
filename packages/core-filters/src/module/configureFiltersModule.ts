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
import {
  configureFilterSearchModule,
  FilterSearchModule,
  SearchAssortments,
  SearchProducts,
} from './configureFilterSearchModule.js';
import { configureFilterTextsModule, FilterTextsModule } from './configureFilterTextsModule.js';
import createFilterValueParser from '../filter-value-parsers/index.js';
import { filtersSettings, FiltersSettingsOptions } from '../filters-settings.js';
import { FilterQuery } from '../search/search.js';

export type FilterOption = Filter & {
  filterOption: string;
};

export { SearchAssortments, SearchProducts };

export type FiltersModule = {
  // Queries
  count: (query: FilterQuery) => Promise<number>;

  findFilter: (params: { filterId?: string; key?: string }) => Promise<Filter>;

  findFilters: (
    params: FilterQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    options?: mongodb.FindOptions<Filter>,
  ) => Promise<Array<Filter>>;

  filterExists: (params: { filterId: string }) => Promise<boolean>;

  invalidateCache: (query: mongodb.Filter<Filter>, unchainedAPI) => Promise<void>;

  // Mutations
  create: (
    doc: Filter & { title: string; locale: string },
    unchainedAPI,
    options?: { skipInvalidation?: boolean },
  ) => Promise<Filter>;

  createFilterOption: (filterId: string, option: { value: string }, unchainedAPI) => Promise<Filter>;

  update: (
    filterId: string,
    doc: Filter,
    unchainedAPI,
    options?: { skipInvalidation?: boolean },
  ) => Promise<Filter>;

  delete: (filterId: string) => Promise<number>;

  removeFilterOption: (
    params: {
      filterId: string;
      filterOptionValue?: string;
    },
    unchainedAPI,
  ) => Promise<Filter>;

  /*
   * Search
   */
  search: FilterSearchModule;

  /*
   * Filter texts
   */

  texts: FilterTextsModule;
};

const FILTER_EVENTS = ['FILTER_CREATE', 'FILTER_REMOVE', 'FILTER_UPDATE'];

export const buildFindSelector = ({
  includeInactive = false,
  queryString = '',
  filterIds,
}: FilterQuery) => {
  const selector: mongodb.Filter<Filter> = {};
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
}: ModuleInput<FiltersSettingsOptions>): Promise<FiltersModule> => {
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

  const invalidateCache = async (selector: mongodb.Filter<Filter>, unchainedAPI) => {
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

  const filterSearch = configureFilterSearchModule({
    Filters,
    filterProductIds,
  });

  const filterTexts = configureFilterTextsModule({
    FilterTexts,
  });

  /*
   * Filter
   */

  return {
    // Queries
    findFilter: async ({ filterId, key }) => {
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
      }: FilterQuery & { limit?: number; offset?: number; sort?: Array<SortOption> },
      options?: mongodb.FindOptions<mongodb.Document>,
    ) => {
      const defaultSortOption = [{ key: 'created', value: SortDirection.ASC }];
      const filters = Filters.find(buildFindSelector(query), {
        ...options,
        skip: offset,
        limit,
        sort: buildSortOptions(sort || defaultSortOption),
      });
      return filters.toArray();
    },

    count: async (query: FilterQuery) => {
      const count = await Filters.countDocuments(buildFindSelector(query));
      return count;
    },

    filterExists: async ({ filterId }) => {
      const filterCount = await Filters.countDocuments(generateDbFilterById(filterId), {
        limit: 1,
      });
      return !!filterCount;
    },

    invalidateCache,

    // Mutations
    create: async ({ type, isActive = false, ...filterData }, unchainedAPI, options) => {
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

    createFilterOption: async (filterId, { value }, unchainedAPI) => {
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

    delete: async (filterId) => {
      await filterTexts.deleteMany({ filterId });
      const { deletedCount } = await Filters.deleteOne({ _id: filterId });
      await emit('FILTER_REMOVE', { filterId });
      return deletedCount;
    },

    removeFilterOption: async ({ filterId, filterOptionValue }, unchainedAPI) => {
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

    update: async (filterId, doc, unchainedAPI, options) => {
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

    // Sub entities
    search: filterSearch,
    texts: filterTexts,
  };
};
