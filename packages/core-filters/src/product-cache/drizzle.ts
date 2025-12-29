import { sha256 } from '@unchainedshop/utils';
import { eq, and, isNull, type DrizzleDb } from '@unchainedshop/store';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';
import { filterProductIdCache } from '../db/schema.ts';

const memoizeCache = new ExpiryMap(process.env.NODE_ENV === 'production' ? 7000 : 1);

async function updateIfHashChanged(
  db: DrizzleDb,
  filterId: string,
  filterOptionValue: string | null,
  productIds: string[],
): Promise<string> {
  const _id = filterOptionValue ? `${filterId}:${filterOptionValue}` : `${filterId}:null`;

  try {
    const hash = await sha256(JSON.stringify(productIds));

    // Check if record exists with different hash
    const existing = await db
      .select()
      .from(filterProductIdCache)
      .where(
        and(
          eq(filterProductIdCache.filterId, filterId),
          filterOptionValue
            ? eq(filterProductIdCache.filterOptionValue, filterOptionValue)
            : isNull(filterProductIdCache.filterOptionValue),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      // Insert new record
      await db.insert(filterProductIdCache).values({
        _id,
        filterId,
        filterOptionValue,
        productIds,
        hash,
      });
    } else if (existing[0].hash !== hash) {
      // Update if hash changed
      await db
        .update(filterProductIdCache)
        .set({ productIds, hash })
        .where(eq(filterProductIdCache._id, existing[0]._id));
    }
  } catch {
    // Ignore upsert conflicts
  }

  return _id;
}

export default function drizzleCache(db: DrizzleDb) {
  const getCachedProductIdsFromMemoryCache = pMemoize(
    async function getCachedProductIdsFromDatabase(filterId: string) {
      const records = await db
        .select({
          filterOptionValue: filterProductIdCache.filterOptionValue,
          productIds: filterProductIdCache.productIds,
        })
        .from(filterProductIdCache)
        .where(eq(filterProductIdCache.filterId, filterId));

      if (!records.length) return null;

      const allProductIds = records.find((cache) => cache.filterOptionValue === null)?.productIds || [];
      const productIdsMap = Object.fromEntries(
        records
          .filter((cache) => cache.filterOptionValue !== null)
          .map((cache) => [cache.filterOptionValue as string, cache.productIds || []]),
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

    async setCachedProductIds(
      filterId: string,
      productIds: string[],
      productIdsMap: Record<string, string[]>,
    ) {
      const baseCacheId = await updateIfHashChanged(db, filterId, null, productIds);

      const cacheIds = await Promise.all(
        Object.entries(productIdsMap).map(async ([filterOptionValue, optionProductIds]) =>
          updateIfHashChanged(db, filterId, filterOptionValue, optionProductIds),
        ),
      );

      const allCacheRecords = cacheIds.concat([baseCacheId]).filter(Boolean);
      return allCacheRecords.length;
    },
  };
}
