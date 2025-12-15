import { type Database } from '@unchainedshop/sqlite';
import { ASSORTMENT_PRODUCT_ID_CACHE_TABLE } from '../db/AssortmentsCollection.ts';

const eqSet = (as: string[], bs: string[]) => {
  return [...as].join(',') === [...bs].join(',');
};

interface CacheDocument {
  _id: string;
  productIds: string[];
  created?: Date;
  updated?: Date;
}

export default function sqliteCache(db: Database) {
  return {
    async getCachedProductIds(assortmentId: string): Promise<string[] | undefined> {
      const doc = db.findById<CacheDocument>(ASSORTMENT_PRODUCT_ID_CACHE_TABLE, assortmentId);
      if (!doc || !doc.productIds) return undefined;
      return doc.productIds;
    },
    async setCachedProductIds(assortmentId: string, productIds: string[]): Promise<number> {
      const existing = db.findById<CacheDocument>(ASSORTMENT_PRODUCT_ID_CACHE_TABLE, assortmentId);

      if (existing) {
        const existingProductIds = existing.productIds || [];
        if (eqSet(productIds, existingProductIds)) {
          return 0;
        }
        // Update
        db.update<CacheDocument>(ASSORTMENT_PRODUCT_ID_CACHE_TABLE, assortmentId, {
          productIds,
          updated: new Date(),
        });
        return 1;
      }

      // Insert
      db.insert<CacheDocument>(ASSORTMENT_PRODUCT_ID_CACHE_TABLE, {
        _id: assortmentId,
        productIds,
        created: new Date(),
      });
      return 1;
    },
  };
}
