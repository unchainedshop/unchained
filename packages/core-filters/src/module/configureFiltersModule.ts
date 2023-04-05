import { SortDirection, SortOption } from '@unchainedshop/types/api.js';
import { Document, Filter as DbFilter, FindOptions, Query } from '@unchainedshop/types/common.js';
import { ModuleInput, ModuleMutations, UnchainedCore } from '@unchainedshop/types/core.js';
import memoizee from 'memoizee';
import {
  Filter,
  FilterQuery,
  FiltersModule,
  FiltersSettingsOptions,
} from '@unchainedshop/types/filters.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { log, LogLevel } from '@unchainedshop/logger';
import { generateDbFilterById, generateDbMutations, buildSortOptions } from '@unchainedshop/mongodb';
import { FilterType } from '../db/FilterType.js';
import { FilterDirector } from '../director/FilterDirector.js';
import { FiltersCollection } from '../db/FiltersCollection.js';
import { FiltersSchema } from '../db/FiltersSchema.js';
import { configureFilterSearchModule } from './configureFilterSearchModule.js';
import { configureFilterTextsModule } from './configureFilterTextsModule.js';
import createFilterValueParser from '../filter-value-parsers/index.js';
import { filtersSettings } from '../filters-settings.js';

const FILTER_EVENTS = ['FILTER_CREATE', 'FILTER_REMOVE', 'FILTER_UPDATE'];

export const buildFindSelector = ({
  includeInactive = false,
  queryString = '',
  filterIds,
}: FilterQuery) => {
  const selector: Query = {};
  if (!includeInactive) selector.isActive = true;
  if (filterIds) {
    selector._id = { $in: filterIds };
  }
  if (queryString) selector.$text = { $search: queryString };
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

  const mutations = generateDbMutations<Filter>(Filters, FiltersSchema, {
    permanentlyDeleteByDefault: true,
    hasCreateOnly: false,
  }) as ModuleMutations<Filter>;

  const findProductIds = async (
    filter: Filter,
    { value }: { value?: boolean | string },
    unchainedAPI: UnchainedCore,
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
    const products = await modules.products.findProducts(
      {
        productSelector,
        includeDrafts: true,
        sort: [],
        offset: 0,
        limit: 0,
      },
      {
        projection: { _id: true },
      },
    );
    return products.map(({ _id }) => _id);
  };

  const buildProductIdMap = async (
    filter: Filter,
    unchainedAPI: UnchainedCore,
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
      unchainedAPI: UnchainedCore,
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
      prmise: true,
      normalizer(args) {
        // args is arguments object as accessible in memoized function
        return `${args[0]._id}-${args[1].values?.toString()}`;
      },
    },
  );

  const invalidateProductIdCache = async (filter: Filter, unchainedAPI: UnchainedCore) => {
    if (!filter) return;

    log(`Filters: Rebuilding ${filter.key}`, { level: LogLevel.Verbose });

    const [productIds, productIdMap] = await buildProductIdMap(filter, unchainedAPI);
    await filtersSettings.setCachedProductIds(filter._id, productIds, productIdMap);
  };

  const invalidateCache = async (selector: DbFilter<Filter>, unchainedAPI: UnchainedCore) => {
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
      options?: FindOptions<Document>,
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
    create: async ({ locale, title, type, isActive = false, ...filterData }, unchainedAPI, options) => {
      const filterId = await mutations.create({
        isActive,
        created: new Date(),
        type: FilterType[type],
        ...filterData,
      });

      const filter = await Filters.findOne(generateDbFilterById(filterId), {});

      if (locale) {
        await filterTexts.upsertLocalizedText({ filterId }, locale, { title });
      }

      if (!options?.skipInvalidation) {
        await invalidateProductIdCache(filter, unchainedAPI);
        filterProductIds.clear();
      }

      await emit('FILTER_CREATE', { filter });

      return filter;
    },

    createFilterOption: async (filterId, { value, title, locale }, unchainedAPI) => {
      const selector = generateDbFilterById(filterId);
      await Filters.updateOne(selector, {
        $set: {
          updated: new Date(),
        },
        $addToSet: {
          options: value,
        },
      });

      await filterTexts.upsertLocalizedText({ filterId, filterOptionValue: value }, locale, { title });

      const filter = await Filters.findOne(selector, {});
      await invalidateProductIdCache(filter, unchainedAPI);
      filterProductIds.clear();

      return filter;
    },

    delete: async (filterId) => {
      await filterTexts.deleteMany({ filterId });
      const deletedCount = await mutations.delete(filterId);
      await emit('FILTER_REMOVE', { filterId });
      return deletedCount;
    },

    removeFilterOption: async ({ filterId, filterOptionValue }, unchainedAPI) => {
      const selector = generateDbFilterById(filterId);
      await Filters.updateOne(selector, {
        $set: {
          updated: new Date(),
        },
        $pull: {
          options: filterOptionValue,
        },
      });

      const filter = await Filters.findOne(selector, {});
      await invalidateProductIdCache(filter, unchainedAPI);
      filterProductIds.clear();

      return filter;
    },

    update: async (_id, doc, unchainedAPI, options) => {
      const filterId = await mutations.update(_id, doc);

      if (filterId && !options?.skipInvalidation) {
        const filter = await Filters.findOne(generateDbFilterById(filterId), {});
        await invalidateProductIdCache(filter, unchainedAPI);
        filterProductIds.clear();
      }

      await emit('FILTER_UPDATE', { filterId, ...doc });

      return filterId;
    },

    // Sub entities
    search: filterSearch,
    texts: filterTexts,
  };
};
