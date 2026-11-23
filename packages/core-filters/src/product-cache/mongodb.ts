import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { sha256, memoizeWithTTL } from '@unchainedshop/utils';
import DataLoader from 'dataloader';

export interface FilterProductIdCacheRecord {
  filterId: string;
  filterOptionValue: string | null;
  productIds: string[];
  /* The filter generation this row was computed from, see filterCacheGeneration. */
  computedAt?: number;
  /* Hash of the row's product ids. Rows without one are read again on every expiry. */
  hash?: string;
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

  // The last value read per filter and the hashes of its rows. When the memo below expires, a
  // filter whose rows still carry the same hashes keeps its arrays instead of decoding them again.
  const lastRead = new Map<
    string,
    { signature: string; value: [string[], Record<string, string[]>] | null }
  >();
  const signatureOf = (rows: { filterOptionValue?: string | null; hash?: string }[] = []) =>
    rows.some((row) => !row.hash)
      ? null
      : rows
          .map((row) => `${row.filterOptionValue ?? ''}\u0000${row.hash}`)
          .sort()
          .join('\u0001');

  // Misses of the same tick share one query. Retention and eviction stay with the memo below.
  const databaseLoader = new DataLoader(
    async (filterIds: readonly string[]) => {
      // Filters read before only need their hashes; the others are read completely. Their entries
      // are taken now, because a purge while the reads below are in flight drops them from lastRead.
      const known = new Map(
        filterIds.flatMap((filterId) => {
          const entry = lastRead.get(filterId);
          return entry ? [[filterId, entry] as const] : [];
        }),
      );
      const hashRows = known.size
        ? await FilterProductIdCache.find(
            { filterId: { $in: [...known.keys()] } },
            { projection: { _id: 0, filterId: 1, filterOptionValue: 1, hash: 1 } },
          ).toArray()
        : [];
      const hashRowsByFilterId = Map.groupBy(hashRows, (row) => row.filterId);
      const unchanged = new Map(
        [...known].filter(
          ([filterId, entry]) => entry.signature === signatureOf(hashRowsByFilterId.get(filterId)),
        ),
      );

      const toRead = filterIds.filter((filterId) => !unchanged.has(filterId));
      const rows = toRead.length
        ? await FilterProductIdCache.find(
            { filterId: { $in: toRead } },
            { projection: { filterId: 1, productIds: 1, filterOptionValue: 1, hash: 1 } },
          ).toArray()
        : [];
      const rowsByFilterId = Map.groupBy(rows, (row) => row.filterId);

      return filterIds.map((filterId) => {
        const kept = unchanged.get(filterId);
        if (kept) return kept.value;
        const filterProductIdCache = rowsByFilterId.get(filterId);
        let value: [string[], Record<string, string[]>] | null = null;
        if (filterProductIdCache) {
          const allProductIds =
            filterProductIdCache.find((cache) => cache.filterOptionValue === null)?.productIds || [];
          const productIdsMap = Object.fromEntries(
            filterProductIdCache
              .filter((cache) => cache.filterOptionValue !== null)
              .map((cache) => [cache.filterOptionValue as string, cache.productIds]),
          );
          value = [allProductIds, productIdsMap];
        }
        const signature = signatureOf(filterProductIdCache);
        if (signature === null) lastRead.delete(filterId);
        else lastRead.set(filterId, { signature, value });
        return value;
      });
    },
    { cache: false },
  );

  const getCachedProductIdsFromMemoryCache = memoizeWithTTL(
    async function getCachedProductIdsFromDatabase(filterId: string) {
      return databaseLoader.load(filterId);
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
    lastRead.delete(filterId);
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
