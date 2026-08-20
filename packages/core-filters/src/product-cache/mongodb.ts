import { mongodb } from '@unchainedshop/mongodb';
import { sha256 } from '@unchainedshop/utils';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';
import { FiltersCollection } from '../db/FiltersCollection.ts';

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
  const { FilterProductIdCache } = await FiltersCollection(db);

  const purgeCachedProductIds = async (filterId: string) => {
    await FilterProductIdCache.deleteMany({ filterId });
  };

  // `setCachedProductIds` replaces a filter's cache rather than adding to it, so anything the
  // new map does not mention is retired. Without this an option that was renamed or removed
  // kept answering with the product ids it held the moment it disappeared.
  //
  // The caller guarantees the map is current - see FilterDirector.invalidateProductIdCache,
  // which drops results that a concurrent option change has superseded.
  const pruneObsoleteOptions = async (filterId: string, productIdsMap: Record<string, string[]>) => {
    try {
      await FilterProductIdCache.deleteMany({
        filterId,
        filterOptionValue: { $nin: [null, ...Object.keys(productIdsMap)] },
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
      await pruneObsoleteOptions(filterId, productIdsMap);
      return allCacheRecords.length;
    },
  };
}
