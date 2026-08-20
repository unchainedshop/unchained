import { mongodb } from '@unchainedshop/mongodb';
import { sha256 } from '@unchainedshop/utils';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';
import { filterOptionValues, FiltersCollection } from '../db/FiltersCollection.ts';

const updateIfHashChanged = async (Collection, selector, doc) => {
  const _id = Object.values(selector).join(':');
  try {
    const hash = await sha256(JSON.stringify(doc));
    await Collection.updateOne(
      {
        ...selector,
        hash: { $ne: hash },
      },
      {
        $set: {
          ...doc,
          hash,
        },
        $setOnInsert: {
          _id,
        },
      },
      { upsert: true },
    );
  } catch (e) { } // eslint-disable-line
  return _id;
};

const CACHE_TTL_MS = parseInt(process.env.UNCHAINED_FILTER_CACHE_TTL_MS || '60000', 10);
const memoizeCache = new ExpiryMap(process.env.NODE_ENV === 'production' ? CACHE_TTL_MS : 1);

export default async function mongodbCache(db: mongodb.Db) {
  const { Filters, FilterProductIdCache } = await FiltersCollection(db);

  // Drop cache rows of filter options that no longer exist, else an obsolete value keeps
  // resolving to the product ids it had when it was retired.
  //
  // The authoritative set is the filter's *current* options, re-read here and not the
  // productIdsMap we were handed: a full invalidation scans the catalog once per option and
  // can be in flight for minutes, so its snapshot may already be outdated by the time it
  // lands. Pruning against the snapshot would delete options added in the meantime, which
  // turns a stale row into a missing one - a valid option silently resolving to nothing.
  const purgeCachedProductIds = async (filterId: string) => {
    await FilterProductIdCache.deleteMany({ filterId });
  };

  const pruneObsoleteOptions = async (filterId: string) => {
    try {
      const filter = await Filters.findOne({ _id: filterId }, { projection: { options: 1, type: 1 } });

      // The filter is gone, so its whole cache is garbage. Covers an invalidation that was
      // already in flight when the filter got deleted and wrote its rows back afterwards.
      if (!filter) {
        await purgeCachedProductIds(filterId);
        return;
      }

      // Normalized to strings: cache rows are keyed by object key, so a numerically typed
      // option would never match its own row and get re-pruned after every write.
      const currentValues = filterOptionValues(filter).map(String);

      await FilterProductIdCache.deleteMany({
        filterId,
        filterOptionValue: { $nin: [null, ...currentValues] },
      });
    } catch { } // eslint-disable-line
  };

  const getCachedProductIdsFromMemoryCache = pMemoize(
    async function getCachedProductIdsFromDatabase(filterId) {
      const filterProductIdCache = await FilterProductIdCache.find(
        {
          filterId,
        },
        { projection: { productIds: 1, filterOptionValue: 1 } },
      ).toArray();

      if (!filterProductIdCache.length) return null;

      const allProductIds =
        filterProductIdCache.find((cache) => cache.filterOptionValue === null)?.productIds || [];
      const productIdsMap = Object.fromEntries(
        filterProductIdCache
          .filter((cache) => cache.filterOptionValue !== null)
          .map((cache) => [cache.filterOptionValue as string, cache.productIds]),
      );
      return [allProductIds, productIdsMap] as [string[], Record<string, string[]>];
    },
    {
      cache: memoizeCache,
    },
  );

  return {
    async getCachedProductIds(filterId: string) {
      return getCachedProductIdsFromMemoryCache(filterId);
    },
    purgeCachedProductIds,
    async setCachedProductIds(filterId, productIds, productIdsMap) {
      const baseCacheId = await updateIfHashChanged(
        FilterProductIdCache,
        { filterId, filterOptionValue: null },
        { productIds },
      );
      const cacheIds = await Promise.all(
        Object.entries(productIdsMap).map(async ([filterOptionValue, optionProductIds]) =>
          updateIfHashChanged(
            FilterProductIdCache,
            { filterId, filterOptionValue },
            { productIds: optionProductIds },
          ),
        ),
      );
      const allCacheRecords = cacheIds.concat([baseCacheId]).filter(Boolean);
      await pruneObsoleteOptions(filterId);
      return allCacheRecords.length;
    },
  };
}
