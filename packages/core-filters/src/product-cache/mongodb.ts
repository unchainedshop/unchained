import { mongodb } from '@unchainedshop/mongodb';
import { sha256 } from '@unchainedshop/utils';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';
import { FiltersCollection } from '../db/FiltersCollection.js';

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

const memoizeCache = new ExpiryMap(process.env.NODE_ENV === 'production' ? 7000 : 1);

export default async function mongodbCache(db: mongodb.Db) {
  const { FilterProductIdCache } = await FiltersCollection(db);

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
      return allCacheRecords.length;
    },
  };
}
