import { eq, type DrizzleDb } from '@unchainedshop/store';
import { assortmentProductIdCache } from '../db/schema.ts';

const eqSet = (as: string[], bs: string[]) => {
  return [...as].join(',') === [...bs].join(',');
};

export default function drizzleCache(db: DrizzleDb) {
  return {
    async getCachedProductIds(assortmentId: string): Promise<string[] | undefined> {
      const [record] = await db
        .select()
        .from(assortmentProductIdCache)
        .where(eq(assortmentProductIdCache._id, assortmentId))
        .limit(1);
      return record?.productIds ?? undefined;
    },

    async setCachedProductIds(assortmentId: string, productIds: string[]): Promise<number> {
      const [existing] = await db
        .select()
        .from(assortmentProductIdCache)
        .where(eq(assortmentProductIdCache._id, assortmentId))
        .limit(1);

      if (existing && eqSet(productIds, existing.productIds ?? [])) {
        return 0;
      }

      const now = new Date();
      if (existing) {
        await db
          .update(assortmentProductIdCache)
          .set({ productIds, updated: now })
          .where(eq(assortmentProductIdCache._id, assortmentId));
      } else {
        await db.insert(assortmentProductIdCache).values({
          _id: assortmentId,
          productIds,
          created: now,
        });
      }
      return 1;
    },
  };
}
