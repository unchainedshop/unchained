import { mongodb } from '@unchainedshop/mongodb';
import { sha256 } from '@unchainedshop/utils';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';
import { FiltersCollection } from '../db/FiltersCollection.js';
import { FiltersSettingsOptions } from '../filters-settings.js';

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

const memoizeCache = new ExpiryMap(7000);

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

      const allProductIds =
        filterProductIdCache.find((cache) => cache.filterOptionValue === null)?.productIds || [];
      const productIdsMap = Object.fromEntries(
        filterProductIdCache
          .filter((cache) => cache.filterOptionValue !== null)
          .map((cache) => [cache.filterOptionValue, cache.productIds]),
      );
      return [allProductIds, productIdsMap];
    },
    {
      cache: memoizeCache,
    },
  );

  return {
    async getCachedProductIds(filterId) {
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
  } as {
    getCachedProductIds: FiltersSettingsOptions['getCachedProductIds'];
    setCachedProductIds: FiltersSettingsOptions['setCachedProductIds'];
  };
}
