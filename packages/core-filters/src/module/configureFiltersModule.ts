import { Context } from '@unchainedshop/types/api';
import {
  Filter as DbFilter,
  ModuleInput,
  ModuleMutations,
  Query,
} from '@unchainedshop/types/common';
import {
  Filter,
  FilterCache,
  FiltersModule,
} from '@unchainedshop/types/filters';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log, LogLevel } from 'meteor/unchained:logger';
import {
  dbIdToString,
  generateDbFilterById,
  generateDbMutations,
} from 'meteor/unchained:utils';
import { FilterType } from '../db/FilterType';
import { FilterDirector } from '../director/FilterDirector';
import { CleanedFilterCache } from '../search/search';
import util from 'util';
import zlib from 'zlib';
import { FiltersCollection } from '../db/FiltersCollection';
import { FiltersSchema } from '../db/FiltersSchema';
import { configureFilterSearchModule } from './configureFilterSearchModule';
import { configureFilterTextsModule } from './configureFilterTextsModule';

const FILTER_EVENTS = ['FILTER_CREATE', 'FILTER_REMOVE', 'FILTER_UPDATE'];

const buildFindSelector = ({ includeInactive = false }) => {
  const selector: Query = {};
  if (!includeInactive) selector.isActive = true;
  return selector;
};

const MAX_UNCOMPRESSED_FILTER_PRODUCTS = 1000;

export const configureFiltersModule = async ({
  db,
  skipInvalidationOnStartup,
}: ModuleInput & {
  skipInvalidationOnStartup: boolean;
}): Promise<FiltersModule> => {
  registerEvents(FILTER_EVENTS);

  const { Filters, FilterTexts } = await FiltersCollection(db);

  const mutations = generateDbMutations<Filter>(
    Filters,
    FiltersSchema
  ) as ModuleMutations<Filter>;

  const findProductIds = async (
    filter: Filter,
    { value }: { value?: boolean | string },
    requestContext: Context
  ) => {
    const { modules } = requestContext;
    const director = FilterDirector.actions(
      { filter, searchQuery: {} },
      requestContext
    );
    const selector = await director.transformProductSelector(
      modules.products.search.buildActiveStatusFilter(),
      {
        key: filter.key,
        value,
      }
    );

    if (!selector) return [];

    const products = await modules.products.findProducts(selector, {
      projection: { _id: true },
    });
    return products.map(({ _id }) => dbIdToString(_id));
  };

  const buildProductIdMap = async (filter: Filter, requestContext: Context) => {
    const cache: CleanedFilterCache = {
      allProductIds: await findProductIds(filter, {}, requestContext),
      productIds: {},
    };

    if (filter.type === FilterType.SWITCH) {
      cache.productIds = {
        true: await findProductIds(filter, { value: true }, requestContext),
        false: await findProductIds(filter, { value: false }, requestContext),
      };
    } else {
      cache.productIds = await (filter.options || []).reduce(
        async (accumulatorPromise, option) => {
          const accumulator = await accumulatorPromise;
          return {
            ...accumulator,
            [option]: await findProductIds(
              filter,
              { value: option },
              requestContext
            ),
          };
        },
        Promise.resolve({})
      );
    }

    return cache;
  };

  const cache = async (filter: Filter) => {
    // eslint-disable-next-line
    let filterCache = filter._cache;

    if (!filterCache) return null;

    // TODO: Check with Pascal about the caching logic
    // if (filter._isCacheTransformed) {
    //   cleanedCache = filterCache as CleanedFilterCache
    // } else {
    if (filterCache.compressed) {
      const gunzip = util.promisify(zlib.gunzip);
      /* @ts-ignore */
      filterCache = JSON.parse(await gunzip(filterCache.compressed)); // eslint-disable-line
    }

    const cleanedCache: CleanedFilterCache = {
      allProductIds: filterCache.allProductIds,
      productIds: filterCache.productIds.reduce(
        (accumulator, [key, value]) => ({
          ...accumulator,
          [key]: value,
        }),
        {}
      ),
    };
    //   filter._isCacheTransformed = true;
    // }

    return cleanedCache;
  };

  const filterProductIds = async (
    filter: Filter,
    {
      values,
      forceLiveCollection,
    }: { values: Array<string>; forceLiveCollection?: boolean },
    requestContext: Context
  ) => {
    const getProductIds =
      (!forceLiveCollection && cache(filter)) ||
      buildProductIdMap(filter, requestContext);
    const { allProductIds, productIds } = await getProductIds;

    if (filter.type === FilterType.SWITCH) {
      const [stringifiedBoolean] = values;
      if (stringifiedBoolean !== undefined) {
        if (
          !stringifiedBoolean ||
          stringifiedBoolean === 'false' ||
          stringifiedBoolean === '0'
        ) {
          return productIds.false;
        }
        return productIds.true;
      }
      return allProductIds;
    }

    const reducedByValues = values.reduce((accumulator, value) => {
      const additionalValues =
        value === undefined ? allProductIds : productIds[value];
      return [...accumulator, ...(additionalValues || [])];
    }, []);
    return reducedByValues;
  };

  const invalidateProductIdCache = async (
    filter: Filter,
    requestContext: Context
  ) => {
    log(`Filters: Rebuilding ${filter.key}`, { level: LogLevel.Verbose });

    const { productIds, allProductIds } = await buildProductIdMap(
      filter,
      requestContext
    );
    const cache: FilterCache = {
      allProductIds,
      productIds: Object.values(productIds).flatMap((ids) => ids),
    };

    const gzip = util.promisify(zlib.gzip);
    const compressedCache =
      allProductIds.length > MAX_UNCOMPRESSED_FILTER_PRODUCTS
        ? await gzip(JSON.stringify(cache))
        : null;

    await Filters.updateOne(generateDbFilterById(filter._id), {
      $set: {
        _cache: compressedCache
          ? {
              compressed: compressedCache,
            }
          : cache,
      },
    });
  };

  const invalidateCache = async (
    selector: DbFilter<Filter>,
    requestContext: Context
  ) => {
    log('Filters: Start invalidating filter caches', {
      level: LogLevel.Verbose,
    });

    const filters = await Filters.find(selector || {}).toArray();

    filters.forEach((filter) => {
      invalidateProductIdCache(filter, requestContext);
    });
  };

  const filterSearch = configureFilterSearchModule({
    Filters,
    filterProductIds,
  });

  const filterTexts = configureFilterTextsModule({
    Filters,
    FilterTexts,
  });

  // TODO: Move somewhere else
  // if (!skipInvalidationOnStartup) {
  //   Meteor.defer(() => {
  //     invalidateCache({});
  //   });
  // }

  /*
   * Filter
   */

  return {
    // Queries
    findFilter: async ({ filterId }) => {
      return await Filters.findOne(generateDbFilterById(filterId));
    },

    findFilters: async ({ limit, offset, ...query }) => {
      const filters = Filters.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: { sequence: 1 },
      });
      return await filters.toArray();
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

    // Mutations
    create: async (
      { locale, title, type, isActive = false, authorId, ...filterData },
      requestContext,
      options
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
        userId
      );

      const filter = await Filters.findOne(generateDbFilterById(filterId));

      if (locale) {
        filterTexts.upsertLocalizedText(
          { filterId },
          locale,
          { filterId, title, authorId, locale },
          userId
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

      filterTexts.upsertLocalizedText(
        { filterId, filterOptionValue: value },
        localeContext.language,
        { title, authorId: userId, filterId, filterOptionValue: value },
        userId
      );

      return await Filters.findOne(selector);
    },

    delete: async (filterId, requestContext, options) => {
      const { userId } = requestContext;

      await filterTexts.deleteMany(filterId, userId);

      const deletedResult = await Filters.deleteOne(
        generateDbFilterById(filterId)
      );

      if (deletedResult.deletedCount === 1 && !options?.skipInvalidation) {
        // Invalidate all filters
        invalidateCache({}, requestContext);
      }

      emit('FILTER_REMOVE', { filterId });

      return deletedResult.deletedCount;
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

      return await Filters.findOne(selector);
    },

    update: async (filterId, doc, requestContext, options) => {
      const { userId } = requestContext;

      await mutations.update(filterId, doc, userId);

      const filter = await Filters.findOne(generateDbFilterById(filterId));

      if (!options?.skipInvalidation) {
        invalidateProductIdCache(filter, requestContext);
      }

      emit('FILTER_UPDATE', { filter });

      return filter;
    },

    // Sub entities
    search: filterSearch,
    texts: filterTexts,
  };
};
