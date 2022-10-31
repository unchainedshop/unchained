import { Context, SortDirection, SortOption } from '@unchainedshop/types/api';
import { Document, Filter as DbFilter, FindOptions, Query } from '@unchainedshop/types/common';
import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core';
import memoizee from 'memoizee';
import {
  Filter,
  FilterQuery,
  FiltersModule,
  FiltersSettingsOptions,
} from '@unchainedshop/types/filters';
import { emit, registerEvents } from '@unchainedshop/events';
import { log, LogLevel } from '@unchainedshop/logger';
import { generateDbFilterById, generateDbMutations, buildSortOptions } from '@unchainedshop/utils';
import { FilterType } from '../db/FilterType';
import { FilterDirector } from '../director/FilterDirector';
import { FiltersCollection } from '../db/FiltersCollection';
import { FiltersSchema } from '../db/FiltersSchema';
import { configureFilterSearchModule } from './configureFilterSearchModule';
import { configureFilterTextsModule } from './configureFilterTextsModule';
import createFilterValueParser from '../filter-value-parsers';
import { filtersSettings } from '../filters-settings';

const FILTER_EVENTS = ['FILTER_CREATE', 'FILTER_REMOVE', 'FILTER_UPDATE'];

const buildFindSelector = ({ includeInactive = false, queryString = '' }: FilterQuery) => {
  const selector: Query = {};
  if (!includeInactive) selector.isActive = true;
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
    requestContext: Context,
  ) => {
    const { modules } = requestContext;
    const director = await FilterDirector.actions({ filter, searchQuery: {} }, requestContext);
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
    requestContext: Context,
  ): Promise<[Array<string>, Record<string, Array<string>>]> => {
    const allProductIds = await findProductIds(filter, {}, requestContext);
    const productIdsMap =
      filter.type === FilterType.SWITCH
        ? {
            true: await findProductIds(filter, { value: true }, requestContext),
            false: await findProductIds(filter, { value: false }, requestContext),
          }
        : await (filter.options || []).reduce(async (accumulatorPromise, option) => {
            const accumulator = await accumulatorPromise;
            return {
              ...accumulator,
              [option]: await findProductIds(filter, { value: option }, requestContext),
            };
          }, Promise.resolve({}));

    return [allProductIds, productIdsMap];
  };

  const filterProductIds = memoizee(
    async function filterProductIdsRaw(
      filter: Filter,
      { values, forceLiveCollection }: { values: Array<string>; forceLiveCollection?: boolean },
      requestContext: Context,
    ) {
      const getProductIds =
        (!forceLiveCollection && (await filtersSettings.getCachedProductIds(filter._id))) ||
        (await buildProductIdMap(filter, requestContext));

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

  const invalidateProductIdCache = async (filter: Filter, requestContext: Context) => {
    if (!filter) return;

    log(`Filters: Rebuilding ${filter.key}`, { level: LogLevel.Verbose });

    const [productIds, productIdMap] = await buildProductIdMap(filter, requestContext);
    await filtersSettings.setCachedProductIds(filter._id, productIds, productIdMap);
  };

  const invalidateCache = async (selector: DbFilter<Filter>, requestContext: Context) => {
    log('Filters: Start invalidating filter caches', {
      level: LogLevel.Verbose,
    });

    const filters = await Filters.find(selector || {}).toArray();
    await filters.reduce(async (lastPromise, filter) => {
      await lastPromise;
      return invalidateProductIdCache(filter, requestContext);
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
      const defaultSortOption = [{ key: 'sequence', value: SortDirection.ASC }];
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
    create: async (
      { locale, title, type, isActive = false, authorId, ...filterData },
      requestContext,
      options,
    ) => {
      const { userId } = requestContext;

      const filterId = await mutations.create(
        {
          isActive,
          created: new Date(),
          type: FilterType[type],
          authorId,
          ...filterData,
        },
        userId,
      );

      const filter = await Filters.findOne(generateDbFilterById(filterId), {});

      if (locale) {
        await filterTexts.upsertLocalizedText({ filterId }, locale, { title }, userId);
      }

      if (!options?.skipInvalidation) {
        await invalidateProductIdCache(filter, requestContext);
        filterProductIds.clear();
      }

      emit('FILTER_CREATE', { filter });

      return filter;
    },

    createFilterOption: async (filterId, { value, title }, requestContext) => {
      const { localeContext, userId } = requestContext;
      const selector = generateDbFilterById(filterId);
      await Filters.updateOne(selector, {
        $set: {
          updated: new Date(),
          updatedBy: userId,
        },
        $addToSet: {
          options: value,
        },
      });

      await filterTexts.upsertLocalizedText(
        { filterId, filterOptionValue: value },
        localeContext.language,
        { title },
        userId,
      );

      const filter = await Filters.findOne(selector, {});
      await invalidateProductIdCache(filter, requestContext);
      filterProductIds.clear();

      return filter;
    },

    delete: async (filterId, userId) => {
      await filterTexts.deleteMany(filterId, userId);
      const deletedCount = await mutations.delete(filterId, userId);
      emit('FILTER_REMOVE', { filterId });
      return deletedCount;
    },

    removeFilterOption: async ({ filterId, filterOptionValue }, requestContext) => {
      const { userId } = requestContext;
      const selector = generateDbFilterById(filterId);
      await Filters.updateOne(selector, {
        $set: {
          updated: new Date(),
          updatedBy: userId,
        },
        $pull: {
          options: filterOptionValue,
        },
      });

      const filter = await Filters.findOne(selector, {});
      await invalidateProductIdCache(filter, requestContext);
      filterProductIds.clear();

      return filter;
    },

    update: async (_id, doc, requestContext, options, userId) => {
      const filterId = await mutations.update(_id, doc, userId);

      if (filterId && !options?.skipInvalidation) {
        const filter = await Filters.findOne(generateDbFilterById(filterId), {});
        await invalidateProductIdCache(filter, requestContext);
        filterProductIds.clear();
      }

      emit('FILTER_UPDATE', { filterId, ...doc });

      return filterId;
    },

    // Sub entities
    search: filterSearch,
    texts: filterTexts,
  };
};
