import { emit, registerEvents } from '@unchainedshop/events';
import { type Database, generateId, toSqliteDate, type FindOptions } from '@unchainedshop/sqlite';
import {
  type InvalidateCacheFn,
  type AssortmentProduct,
  ASSORTMENT_PRODUCTS_TABLE,
} from '../db/AssortmentsCollection.ts';

const ASSORTMENT_PRODUCT_EVENTS = [
  'ASSORTMENT_ADD_PRODUCT',
  'ASSORTMENT_REMOVE_PRODUCT',
  'ASSORTMENT_REORDER_PRODUCTS',
];

export const configureAssortmentProductsModule = ({
  db,
  invalidateCache,
}: {
  db: Database;
  invalidateCache: InvalidateCacheFn;
}) => {
  registerEvents(ASSORTMENT_PRODUCT_EVENTS);

  return {
    // Queries
    findAssortmentIds: async ({
      productId,
      tags,
    }: {
      productId: string;
      tags?: string[];
    }): Promise<string[]> => {
      let sql = `SELECT assortment_id FROM ${ASSORTMENT_PRODUCTS_TABLE} WHERE product_id = ?`;
      const params: any[] = [productId];

      if (tags && tags.length > 0) {
        // Check if tags JSON array contains any of the specified tags
        // Use json_extract on data column since tags is stored in JSON
        const tagConditions = tags.map(
          () => `EXISTS (SELECT 1 FROM json_each(json_extract(data, '$.tags')) WHERE value = ?)`,
        );
        sql += ` AND (${tagConditions.join(' OR ')})`;
        params.push(...tags);
      }

      return db.queryColumn<string>(sql, params);
    },

    findProductIds: async ({
      assortmentId,
      tags,
    }: {
      assortmentId: string;
      tags?: string[];
    }): Promise<string[]> => {
      let sql = `SELECT product_id FROM ${ASSORTMENT_PRODUCTS_TABLE} WHERE assortment_id = ?`;
      const params: any[] = [assortmentId];

      if (tags && tags.length > 0) {
        const tagConditions = tags.map(
          () => `EXISTS (SELECT 1 FROM json_each(json_extract(data, '$.tags')) WHERE value = ?)`,
        );
        sql += ` AND (${tagConditions.join(' OR ')})`;
        params.push(...tags);
      }

      return db.queryColumn<string>(sql, params);
    },

    findAssortmentProduct: async ({ assortmentProductId }: { assortmentProductId: string }) => {
      return db.findById<AssortmentProduct>(ASSORTMENT_PRODUCTS_TABLE, assortmentProductId);
    },

    findAssortmentProducts: async (
      selector: {
        assortmentId?: string;
        assortmentIds?: string[];
        productId?: string;
        productIds?: string[];
      },
      options?: FindOptions,
    ): Promise<AssortmentProduct[]> => {
      const { productId, productIds, assortmentId, assortmentIds } = selector;
      const where: Record<string, any> = {};

      if (assortmentIds && assortmentIds.length > 0) {
        where.assortmentId = { $in: assortmentIds };
      } else if (assortmentId) {
        where.assortmentId = assortmentId;
      }

      if (productIds && productIds.length > 0) {
        where.productId = { $in: productIds };
      } else if (productId) {
        where.productId = productId;
      }

      if (Object.keys(where).length === 0) return [];

      // Default sort by sortKey if not specified
      const effectiveOptions = options ? { ...options } : {};
      if (!effectiveOptions.sort) {
        effectiveOptions.sort = { sortKey: 1 };
      }

      return db.find<AssortmentProduct>(ASSORTMENT_PRODUCTS_TABLE, {
        where,
        ...effectiveOptions,
      });
    },

    findSiblings: async ({
      assortmentIds,
      productId,
    }: {
      productId: string;
      assortmentIds: string[];
    }): Promise<string[]> => {
      if (assortmentIds.length === 0) return [];

      const placeholders = assortmentIds.map(() => '?').join(', ');
      const sql = `SELECT product_id FROM ${ASSORTMENT_PRODUCTS_TABLE}
                   WHERE assortment_id IN (${placeholders}) AND product_id != ?
                   ORDER BY sort_key ASC`;
      return db.queryColumn<string>(sql, [...assortmentIds, productId]);
    },

    // Mutations
    create: async (
      doc: Omit<AssortmentProduct, '_id' | 'created' | 'sortKey'> &
        Partial<Pick<AssortmentProduct, '_id' | 'created' | 'sortKey'>>,
      options?: { skipInvalidation?: boolean },
    ) => {
      const {
        _id: assortmentProductId,
        assortmentId,
        productId,
        sortKey,
        tags = [],
        meta,
        ...rest
      } = doc;

      // Check if exists (upsert behavior)
      const existing = db.findOne<AssortmentProduct>(ASSORTMENT_PRODUCTS_TABLE, {
        where: { assortmentId, productId },
      });

      const now = new Date();

      if (existing) {
        // Update existing
        const updates: Partial<AssortmentProduct> = {
          ...rest,
          tags,
          meta,
          updated: now,
        };
        if (sortKey !== undefined) {
          updates.sortKey = sortKey;
        }
        const assortmentProduct = db.update<AssortmentProduct>(
          ASSORTMENT_PRODUCTS_TABLE,
          existing._id,
          updates,
        );
        await emit('ASSORTMENT_ADD_PRODUCT', { assortmentProduct });

        if (!options?.skipInvalidation && assortmentProduct) {
          await invalidateCache({ assortmentIds: [assortmentProduct.assortmentId] });
        }
        return assortmentProduct;
      }

      // Get next sort key if not provided
      let finalSortKey = sortKey;
      if (finalSortKey === undefined || finalSortKey === null) {
        const last = db.findOne<AssortmentProduct>(ASSORTMENT_PRODUCTS_TABLE, {
          where: { assortmentId },
          sort: { sortKey: -1 },
          limit: 1,
        });
        finalSortKey = (last?.sortKey || 0) + 1;
      }

      const assortmentProduct = db.insert<AssortmentProduct>(ASSORTMENT_PRODUCTS_TABLE, {
        _id: assortmentProductId || generateId(),
        assortmentId,
        productId,
        sortKey: finalSortKey,
        tags,
        meta,
        created: now,
        ...rest,
      } as AssortmentProduct);

      await emit('ASSORTMENT_ADD_PRODUCT', { assortmentProduct });

      if (!options?.skipInvalidation) {
        await invalidateCache({ assortmentIds: [assortmentProduct.assortmentId] });
      }

      return assortmentProduct;
    },

    delete: async (assortmentProductId: string, options?: { skipInvalidation?: boolean }) => {
      const assortmentProduct = db.findById<AssortmentProduct>(
        ASSORTMENT_PRODUCTS_TABLE,
        assortmentProductId,
      );
      if (!assortmentProduct) return null;

      db.delete(ASSORTMENT_PRODUCTS_TABLE, assortmentProductId);

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
        _id?: { $nin?: string[] };
        assortmentId?: string;
        productId?: string;
      },
      options?: { skipInvalidation?: boolean },
    ): Promise<number> => {
      const conditions: string[] = [];
      const params: any[] = [];

      // Handle _id exclusion
      if (selector._id?.$nin && selector._id.$nin.length > 0) {
        const placeholders = selector._id.$nin.map(() => '?').join(', ');
        conditions.push(`_id NOT IN (${placeholders})`);
        params.push(...selector._id.$nin);
      }

      if (selector.assortmentId) {
        conditions.push('assortment_id = ?');
        params.push(selector.assortmentId);
      }
      if (selector.productId) {
        conditions.push('product_id = ?');
        params.push(selector.productId);
      }

      if (conditions.length === 0) return 0;

      const whereClause = conditions.join(' AND ');

      // Get products for events and invalidation
      const assortmentProducts = db.query<AssortmentProduct>(
        `SELECT data FROM ${ASSORTMENT_PRODUCTS_TABLE} WHERE ${whereClause}`,
        params,
      );

      const { changes } = db.run(
        `DELETE FROM ${ASSORTMENT_PRODUCTS_TABLE} WHERE ${whereClause}`,
        params,
      );

      await Promise.all(
        assortmentProducts.map(async (assortmentProduct) =>
          emit('ASSORTMENT_REMOVE_PRODUCT', {
            assortmentProductId: assortmentProduct._id,
          }),
        ),
      );

      if (!options?.skipInvalidation && assortmentProducts.length) {
        await invalidateCache({
          assortmentIds: assortmentProducts.map((product) => product.assortmentId),
        });
      }

      return changes;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (
      assortmentProductId: string,
      doc: Partial<AssortmentProduct>,
      options?: { skipInvalidation?: boolean },
    ) => {
      const updates = { ...doc, updated: new Date() };
      const assortmentProduct = db.update<AssortmentProduct>(
        ASSORTMENT_PRODUCTS_TABLE,
        assortmentProductId,
        updates,
      );

      if (!options?.skipInvalidation && assortmentProduct) {
        await invalidateCache({ assortmentIds: [assortmentProduct.assortmentId] });
      }
      return assortmentProduct;
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
      const now = toSqliteDate(new Date());
      const changedAssortmentProductIds: string[] = [];

      for (const { assortmentProductId, sortKey } of sortKeys) {
        db.run(
          `UPDATE ${ASSORTMENT_PRODUCTS_TABLE} SET data = json_set(data, '$.sortKey', ?, '$.updated', ?) WHERE _id = ?`,
          [sortKey + 1, now, assortmentProductId],
        );
        changedAssortmentProductIds.push(assortmentProductId);
      }

      if (changedAssortmentProductIds.length === 0) return [];

      const placeholders = changedAssortmentProductIds.map(() => '?').join(', ');
      const assortmentProducts = db.query<AssortmentProduct>(
        `SELECT data FROM ${ASSORTMENT_PRODUCTS_TABLE} WHERE _id IN (${placeholders})`,
        changedAssortmentProductIds,
      );

      if (!options?.skipInvalidation && assortmentProducts.length) {
        await invalidateCache({
          assortmentIds: assortmentProducts.map((product) => product.assortmentId),
        });
      }

      await emit('ASSORTMENT_REORDER_PRODUCTS', { assortmentProducts });

      return assortmentProducts;
    },
  };
};

export type AssortmentProductsModule = ReturnType<typeof configureAssortmentProductsModule>;
