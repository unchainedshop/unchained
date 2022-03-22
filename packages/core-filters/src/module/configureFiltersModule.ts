import { Context } from '@unchainedshop/types/api';
import { Filter as DbFilter, ModuleInput, ModuleMutations, Query } from '@unchainedshop/types/common';
import { Filter, FiltersModule, FiltersSettingsOptions } from '@unchainedshop/types/filters';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log, LogLevel } from 'meteor/unchained:logger';
import { generateDbFilterById, generateDbMutations } from 'meteor/unchained:utils';
import { FilterType } from '../db/FilterType';
import { FilterDirector } from '../director/FilterDirector';
import { FiltersCollection } from '../db/FiltersCollection';
import { FiltersSchema } from '../db/FiltersSchema';
import { configureFilterSearchModule } from './configureFilterSearchModule';
import { configureFilterTextsModule } from './configureFilterTextsModule';
import createFilterValueParser from '../filter-value-parsers';
import { filtersSettings } from '../filters-settings';

const FILTER_EVENTS = ['FILTER_CREATE', 'FILTER_REMOVE', 'FILTER_UPDATE'];

const buildFindSelector = ({ includeInactive = false }) => {
  const selector: Query = {};
  if (!includeInactive) selector.isActive = true;
  return selector;
};

const MAX_UNCOMPRESSED_FILTER_PRODUCTS = 1000;

export const configureFiltersModule = async ({
  db,
  options: filtersOptions = {}
}: ModuleInput<FiltersSettingsOptions>): Promise<FiltersModule> => {
  registerEvents(FILTER_EVENTS);

  // Settings
  await filtersSettings.configureSettings(filtersOptions, db);

  const { Filters, FilterTexts } = await FiltersCollection(db);

  const mutations = generateDbMutations<Filter>(Filters, FiltersSchema, {
    permanentlyDeleteByDefault: true,
  }) as ModuleMutations<Filter>;

  const findProductIds = async (
    filter: Filter,
    { value }: { value?: boolean | string },
    requestContext: Context,
  ) => {
    const { modules } = requestContext;
    const director = FilterDirector.actions({ filter, searchQuery: {} }, requestContext);
    const selector = await director.transformProductSelector(
      modules.products.search.buildActiveStatusFilter(),
      {
        key: filter.key,
        value,
      },
    );

    if (!selector) return [];

    const products = await modules.products.findProducts(selector, {
      projection: { _id: true },
    });
    return products.map(({ _id }) => _id);
  };

  const buildProductIdMap = async (filter: Filter, requestContext: Context) => {
    const allProductIds = await findProductIds(filter, {}, requestContext);
    const productIdsMap = (filter.type === FilterType.SWITCH) ? {
      true: await findProductIds(filter, { value: true }, requestContext),
      false: await findProductIds(filter, { value: false }, requestContext),
    } : (await (filter.options || []).reduce(
      async (accumulatorPromise, option) => {
        const accumulator = await accumulatorPromise;
        return {
          ...accumulator,
          [option]: await findProductIds(filter, { value: option }, requestContext),
        };
      },
      Promise.resolve({}),
    ))

    return [allProductIds, productIdsMap];
  };

  const filterProductIds = async (
    filter: Filter,
    { values, forceLiveCollection }: { values: Array<string>; forceLiveCollection?: boolean },
    requestContext: Context,
  ) => {
    const getProductIds =
      (!forceLiveCollection && (await filtersSettings.getCachedProductIds(filter._id))) ||
      (await buildProductIdMap(filter, requestContext));

    const [allProductIds, productIds] = getProductIds;
    const parse = createFilterValueParser(filter.type);

    return parse(values, Object.keys(productIds)).reduce((accumulator, value) => {
      const additionalValues = value === undefined ? allProductIds : productIds[value];
      return [...accumulator, ...(additionalValues || [])];
    }, []);
  };

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
    await Promise.all(filters.map((filter) => invalidateProductIdCache(filter, requestContext)));
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
    findFilter: async ({ filterId }) => {
      return Filters.findOne(generateDbFilterById(filterId), {});
    },

    findFilters: async ({ limit, offset, ...query }) => {
      const filters = Filters.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: { sequence: 1 },
      });
      return filters.toArray();
    },

    count: async (query) => {
      const count = await Filters.find(buildFindSelector(query)).count();
      return count;
    },

    filterExists: async ({ filterId }) => {
      const filterCount = await Filters.find(generateDbFilterById(filterId), {
        limit: 1,
      }).count();
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
        await filterTexts.upsertLocalizedText(
          { filterId },
          locale,
          { filterId, title, authorId, locale },
          userId,
        );
      }

      if (!options?.skipInvalidation) {
        invalidateProductIdCache(filter, requestContext);
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
        { title, authorId: userId, filterId, filterOptionValue: value },
        userId,
      );

      return Filters.findOne(selector, {});
    },

    delete: async (filterId, userId) => {
      await filterTexts.deleteMany(filterId, userId);
      const deletedCount = await mutations.delete(filterId, userId);
      emit('FILTER_REMOVE', { filterId });
      return deletedCount;
    },

    removeFilterOption: async ({ filterId, filterOptionValue }, userId) => {
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

      return Filters.findOne(selector, {});
    },

    update: async (filterId, doc, requestContext, options, userId) => {
      await mutations.update(filterId, doc, userId);

      const filter = await Filters.findOne(generateDbFilterById(filterId), {});

      if (!options?.skipInvalidation) {
        await invalidateProductIdCache(filter, requestContext);
      }

      emit('FILTER_UPDATE', { filter });

      return filter;
    },

    // Sub entities
    search: filterSearch,
    texts: filterTexts,
  };
};
