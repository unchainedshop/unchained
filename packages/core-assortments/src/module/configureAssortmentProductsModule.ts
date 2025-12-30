import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateId,
  eq,
  and,
  or,
  inArray,
  notInArray,
  ne,
  asc,
  desc,
  sql,
  type DrizzleDb,
} from '@unchainedshop/store';
import { assortmentProducts, type AssortmentProduct } from '../db/schema.ts';
import { type InvalidateCacheFn } from './configureAssortmentsModule.ts';

const ASSORTMENT_PRODUCT_EVENTS = [
  'ASSORTMENT_ADD_PRODUCT',
  'ASSORTMENT_REMOVE_PRODUCT',
  'ASSORTMENT_REORDER_PRODUCTS',
];

export const configureAssortmentProductsModule = ({
  db,
  invalidateCache,
}: {
  db: DrizzleDb;
  invalidateCache: InvalidateCacheFn;
}) => {
  registerEvents(ASSORTMENT_PRODUCT_EVENTS);

  return {
    findAssortmentIds: async ({
      productId,
      tags,
    }: {
      productId: string;
      tags?: string[];
    }): Promise<string[]> => {
      const conditions = [eq(assortmentProducts.productId, productId)];

      if (tags?.length) {
        // Match any of the tags
        const tagConditions = tags.map(
          (tag) =>
            sql`EXISTS (SELECT 1 FROM json_each(${assortmentProducts.tags}) WHERE value = ${tag})`,
        );
        conditions.push(or(...tagConditions) as ReturnType<typeof eq>);
      }

      const results = await db
        .select({ assortmentId: assortmentProducts.assortmentId })
        .from(assortmentProducts)
        .where(and(...conditions));

      return results.map((r) => r.assortmentId);
    },

    findProductIds: async ({
      assortmentId,
      tags,
    }: {
      assortmentId: string;
      tags?: string[];
    }): Promise<string[]> => {
      const conditions = [eq(assortmentProducts.assortmentId, assortmentId)];

      if (tags?.length) {
        const tagConditions = tags.map(
          (tag) =>
            sql`EXISTS (SELECT 1 FROM json_each(${assortmentProducts.tags}) WHERE value = ${tag})`,
        );
        conditions.push(or(...tagConditions) as ReturnType<typeof eq>);
      }

      const results = await db
        .select({ productId: assortmentProducts.productId })
        .from(assortmentProducts)
        .where(and(...conditions));

      return results.map((r) => r.productId);
    },

    findAssortmentProduct: async ({ assortmentProductId }: { assortmentProductId: string }) => {
      const [result] = await db
        .select()
        .from(assortmentProducts)
        .where(eq(assortmentProducts._id, assortmentProductId))
        .limit(1);
      return result || null;
    },

    findAssortmentProducts: async (
      {
        productId,
        productIds,
        assortmentId,
        assortmentIds,
      }: {
        assortmentId?: string;
        assortmentIds?: string[];
        productId?: string;
        productIds?: string[];
      },
      options?: { limit?: number; offset?: number; sort?: Record<string, number> },
    ): Promise<AssortmentProduct[]> => {
      void options;
      const conditions: ReturnType<typeof eq>[] = [];

      if (assortmentId) {
        conditions.push(eq(assortmentProducts.assortmentId, assortmentId));
      } else if (assortmentIds?.length) {
        conditions.push(inArray(assortmentProducts.assortmentId, assortmentIds));
      }

      if (productId) {
        conditions.push(eq(assortmentProducts.productId, productId));
      } else if (productIds?.length) {
        conditions.push(inArray(assortmentProducts.productId, productIds));
      }

      if (conditions.length === 0) {
        return db.select().from(assortmentProducts);
      }

      return db
        .select()
        .from(assortmentProducts)
        .where(and(...conditions));
    },

    findSiblings: async ({
      assortmentIds,
      productId,
    }: {
      productId: string;
      assortmentIds: string[];
    }): Promise<string[]> => {
      const results = await db
        .select({ productId: assortmentProducts.productId })
        .from(assortmentProducts)
        .where(
          and(
            inArray(assortmentProducts.assortmentId, assortmentIds),
            ne(assortmentProducts.productId, productId),
          ),
        )
        .orderBy(asc(assortmentProducts.sortKey));

      return results.map((r) => r.productId);
    },

    create: async (
      doc: Omit<AssortmentProduct, '_id' | 'created' | 'sortKey' | 'meta' | 'updated'> &
        Partial<Pick<AssortmentProduct, '_id' | 'created' | 'sortKey' | 'meta' | 'updated'>>,
      options?: { skipInvalidation?: boolean },
    ) => {
      const { _id, assortmentId, productId, sortKey, tags = [], ...rest } = doc;
      const now = new Date();

      // Check if already exists
      const [existing] = await db
        .select()
        .from(assortmentProducts)
        .where(
          and(
            eq(assortmentProducts.assortmentId, assortmentId),
            eq(assortmentProducts.productId, productId),
          ),
        )
        .limit(1);

      if (existing) {
        // Update existing
        await db
          .update(assortmentProducts)
          .set({
            ...rest,
            tags,
            sortKey: sortKey ?? existing.sortKey,
            updated: now,
          })
          .where(eq(assortmentProducts._id, existing._id));

        const [updated] = await db
          .select()
          .from(assortmentProducts)
          .where(eq(assortmentProducts._id, existing._id))
          .limit(1);

        await emit('ASSORTMENT_ADD_PRODUCT', { assortmentProduct: updated });

        if (!options?.skipInvalidation) {
          await invalidateCache({ assortmentIds: [updated.assortmentId] });
        }

        return updated;
      }

      // Get next sort key if not provided
      let newSortKey = sortKey;
      if (newSortKey === undefined || newSortKey === null) {
        const [lastProduct] = await db
          .select({ sortKey: assortmentProducts.sortKey })
          .from(assortmentProducts)
          .where(eq(assortmentProducts.assortmentId, assortmentId))
          .orderBy(desc(assortmentProducts.sortKey))
          .limit(1);
        newSortKey = (lastProduct?.sortKey || 0) + 1;
      }

      const assortmentProductId = _id || generateId();
      await db.insert(assortmentProducts).values({
        _id: assortmentProductId,
        assortmentId,
        productId,
        sortKey: newSortKey,
        tags,
        created: now,
        ...rest,
      });

      const [assortmentProduct] = await db
        .select()
        .from(assortmentProducts)
        .where(eq(assortmentProducts._id, assortmentProductId))
        .limit(1);

      await emit('ASSORTMENT_ADD_PRODUCT', { assortmentProduct });

      if (!options?.skipInvalidation) {
        await invalidateCache({ assortmentIds: [assortmentProduct.assortmentId] });
      }

      return assortmentProduct;
    },

    delete: async (assortmentProductId: string, options?: { skipInvalidation?: boolean }) => {
      const [assortmentProduct] = await db
        .select()
        .from(assortmentProducts)
        .where(eq(assortmentProducts._id, assortmentProductId))
        .limit(1);

      if (!assortmentProduct) return null;

      await db.delete(assortmentProducts).where(eq(assortmentProducts._id, assortmentProductId));

      await emit('ASSORTMENT_REMOVE_PRODUCT', {
        assortmentProductId: assortmentProduct._id,
      });

      if (!options?.skipInvalidation) {
        await invalidateCache({ assortmentIds: [assortmentProduct.assortmentId] });
      }

      return assortmentProduct;
    },

    deleteMany: async (
      selector: {
        assortmentId?: string;
        productId?: string;
        excludeIds?: string[];
      },
      options?: { skipInvalidation?: boolean },
    ): Promise<number> => {
      const conditions: ReturnType<typeof eq>[] = [];

      if (selector.assortmentId) {
        conditions.push(eq(assortmentProducts.assortmentId, selector.assortmentId));
      }
      if (selector.productId) {
        conditions.push(eq(assortmentProducts.productId, selector.productId));
      }
      if (selector.excludeIds?.length) {
        conditions.push(notInArray(assortmentProducts._id, selector.excludeIds));
      }

      if (conditions.length === 0) return 0;

      // Get products before deleting for events and cache invalidation
      const productsToDelete = await db
        .select({ _id: assortmentProducts._id, assortmentId: assortmentProducts.assortmentId })
        .from(assortmentProducts)
        .where(and(...conditions));

      if (productsToDelete.length === 0) return 0;

      const result = await db.delete(assortmentProducts).where(and(...conditions));

      await Promise.all(
        productsToDelete.map(async (p) =>
          emit('ASSORTMENT_REMOVE_PRODUCT', {
            assortmentProductId: p._id,
          }),
        ),
      );

      if (!options?.skipInvalidation && productsToDelete.length) {
        await invalidateCache({
          assortmentIds: productsToDelete.map((p) => p.assortmentId),
        });
      }

      return result.rowsAffected || 0;
    },

    update: async (
      assortmentProductId: string,
      doc: Partial<AssortmentProduct>,
      options?: { skipInvalidation?: boolean },
    ) => {
      const now = new Date();

      await db
        .update(assortmentProducts)
        .set({ ...doc, updated: now })
        .where(eq(assortmentProducts._id, assortmentProductId));

      const [assortmentProduct] = await db
        .select()
        .from(assortmentProducts)
        .where(eq(assortmentProducts._id, assortmentProductId))
        .limit(1);

      if (!options?.skipInvalidation && assortmentProduct) {
        await invalidateCache({ assortmentIds: [assortmentProduct.assortmentId] });
      }

      return assortmentProduct || null;
    },

    updateManualOrder: async (
      {
        sortKeys,
      }: {
        sortKeys: {
          assortmentProductId: string;
          sortKey: number;
        }[];
      },
      options?: { skipInvalidation?: boolean },
    ): Promise<AssortmentProduct[]> => {
      const now = new Date();
      const changedAssortmentProductIds = await Promise.all(
        sortKeys.map(async ({ assortmentProductId, sortKey }) => {
          await db
            .update(assortmentProducts)
            .set({
              sortKey: sortKey + 1,
              updated: now,
            })
            .where(eq(assortmentProducts._id, assortmentProductId));
          return assortmentProductId;
        }),
      );

      const updatedProducts = await db
        .select()
        .from(assortmentProducts)
        .where(inArray(assortmentProducts._id, changedAssortmentProductIds));

      if (!options?.skipInvalidation && updatedProducts.length) {
        await invalidateCache({
          assortmentIds: updatedProducts.map((p) => p.assortmentId),
        });
      }

      await emit('ASSORTMENT_REORDER_PRODUCTS', { assortmentProducts: updatedProducts });

      return updatedProducts;
    },
  };
};

export type AssortmentProductsModule = ReturnType<typeof configureAssortmentProductsModule>;
