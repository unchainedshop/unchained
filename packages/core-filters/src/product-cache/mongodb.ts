import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { sha256, memoizeWithTTL } from '@unchainedshop/utils';

export interface FilterProductIdCacheRecord {
  filterId: string;
  filterOptionValue: string | null;
  productIds: string[];
  /* The filter generation this row was computed from, see filterCacheGeneration. */
  computedAt?: number;
}

const DUPLICATE_KEY = 11000;

/*
 * Rebuilding scans the catalog once per option, so on a large catalog a rebuild is in flight long
 * enough for the filter to change underneath it. Rows record the generation they were computed
 * from, and neither a write nor a prune touches a row a newer generation already claimed.
 *
 * This is what makes replacement safe. Without it an overtaken rebuild publishes ids computed
 * against a filter that has since been renamed or retyped, and retires the options added while it
 * was running - a live option silently resolving to nothing, with no later rebuild to restore it.
 *
 * Rows written before this field existed carry none, which counts as older than anything.
 */
const notNewerThan = (computedAt: number) => ({
  $or: [{ computedAt: { $lte: computedAt } }, { computedAt: { $exists: false } }],
});

const updateIfHashChanged = async (Collection, selector, doc, computedAt: number) => {
  const _id = Object.values(selector).join(':');
  try {
    const hash = await sha256(JSON.stringify(doc));
    await Collection.updateOne(
      {
        ...selector,
        ...notNewerThan(computedAt),
        hash: { $ne: hash },
      },
      {
        $set: {
          ...doc,
          hash,
          computedAt,
        },
        $setOnInsert: {
          _id,
        },
      },
      { upsert: true },
    );
  } catch (e) {
    // The row already holds this hash, or a newer generation already claimed it. Either way the
    // upsert collides on _id and there is nothing to do. Anything else means we did not write,
    // which the caller has to know before it starts deleting the rows this was meant to replace.
    if (e?.code !== DUPLICATE_KEY) return { _id, written: false };
  }
  return { _id, written: true };
};

const CACHE_TTL_MS = parseInt(process.env.UNCHAINED_FILTER_CACHE_TTL_MS || '60000', 10);

export default async function mongodbCache(db: mongodb.Db) {
  // This backend owns the cache collection and its indexes, so nothing provisions them unless the
  // Mongo cache is actually in use.
  const FilterProductIdCache = db.collection<FilterProductIdCacheRecord>('filter_productId_cache');
  await buildDbIndexes(FilterProductIdCache, [
    { index: { productIds: 1 } },
    { index: { filterId: 1, filterOptionValue: 1 } },
  ]);

  const getCachedProductIdsFromMemoryCache = memoizeWithTTL(
    async function getCachedProductIdsFromDatabase(filterId: string) {
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
      ttl: process.env.NODE_ENV === 'production' ? CACHE_TTL_MS : 1,
      cacheKey: ([filterId]) => filterId,
    },
  );

  // Reads are memoized per process, so a write nobody evicts stays invisible for the whole TTL -
  // a minute in production. Long enough for a retired option to keep answering and a newly added
  // one to answer with nothing.
  const evictFromMemoryCache = (filterId: string) => {
    getCachedProductIdsFromMemoryCache.delete(filterId);
  };

  const purgeCachedProductIds = async (filterId: string) => {
    await FilterProductIdCache.deleteMany({ filterId });
    evictFromMemoryCache(filterId);
  };

  return {
    async getCachedProductIds(filterId: string) {
      return getCachedProductIdsFromMemoryCache(filterId);
    },
    purgeCachedProductIds,
    async setCachedProductIds(filterId, productIds, productIdsMap, computedAt = 0) {
      const baseRecord = await updateIfHashChanged(
        FilterProductIdCache,
        { filterId, filterOptionValue: null },
        { productIds },
        computedAt,
      );
      const optionRecords = await Promise.all(
        Object.entries(productIdsMap).map(async ([filterOptionValue, optionProductIds]) =>
          updateIfHashChanged(
            FilterProductIdCache,
            { filterId, filterOptionValue },
            { productIds: optionProductIds },
            computedAt,
          ),
        ),
      );

      const allCacheRecords = optionRecords.concat([baseRecord]);
      evictFromMemoryCache(filterId);

      // Retire whatever this generation does not mention, leaving alone anything a newer one has
      // already written.
      //
      // Skipped entirely if any row failed to write: retiring the old values while the new ones
      // are missing would leave a live option resolving to nothing, and the surviving base row
      // would stop the live fallback from covering for it.
      if (allCacheRecords.every(({ written }) => written)) {
        await FilterProductIdCache.deleteMany({
          filterId,
          filterOptionValue: { $nin: [null, ...Object.keys(productIdsMap)] },
          ...notNewerThan(computedAt),
        });
        evictFromMemoryCache(filterId);
      }

      return allCacheRecords.length;
    },
  };
}
