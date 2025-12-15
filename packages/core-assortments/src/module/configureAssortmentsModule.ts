import { type Tree, type SortOption, SortDirection } from '@unchainedshop/utils';
import { emit, registerEvents } from '@unchainedshop/events';
import { type ModuleInput, generateId, toSqliteDate } from '@unchainedshop/sqlite';
import { createLogger } from '@unchainedshop/logger';
import {
  type Assortment,
  type AssortmentLink,
  type AssortmentProduct,
  type AssortmentQuery,
  type InvalidateCacheFn,
  initAssortmentsSchema,
  ASSORTMENTS_TABLE,
  ASSORTMENT_LINKS_TABLE,
  ASSORTMENT_PRODUCTS_TABLE,
} from '../db/AssortmentsCollection.ts';
import { configureAssortmentFiltersModule } from './configureAssortmentFiltersModule.ts';
import { configureAssortmentLinksModule } from './configureAssortmentLinksModule.ts';
import { assortmentsSettings, type AssortmentsSettingsOptions } from '../assortments-settings.ts';
import { configureAssortmentProductsModule } from './configureAssortmentProductsModule.ts';
import { configureAssortmentTextsModule } from './configureAssortmentTextsModule.ts';
import { configureAssortmentMediaModule } from './configureAssortmentMediaModule.ts';
import { makeAssortmentBreadcrumbsBuilder } from '../utils/breadcrumbs/makeAssortmentBreadcrumbsBuilder.ts';

export interface AssortmentPathLink {
  assortmentId: string;
  childAssortmentId: string;
  parentIds: string[];
}

export type BreadcrumbAssortmentLinkFunction = (childAssortmentId: string) => Promise<AssortmentLink[]>;

export type BreadcrumbAssortmentProductFunction = (productId: string) => Promise<AssortmentProduct[]>;

const logger = createLogger('unchained:core');

const ASSORTMENT_EVENTS = [
  'ASSORTMENT_CREATE',
  'ASSORTMENT_REMOVE',
  'ASSORTMENT_SET_BASE',
  'ASSORTMENT_UPDATE',
];

export const buildFindSelector = ({
  assortmentIds,
  assortmentSelector,
  slugs,
  tags,
  includeLeaves = false,
  includeInactive = false,
  queryString,
}: AssortmentQuery): { where: string; params: any[] } => {
  const conditions: string[] = ['deleted IS NULL'];
  const params: any[] = [];

  if (assortmentIds && assortmentIds.length > 0) {
    const placeholders = assortmentIds.map(() => '?').join(', ');
    conditions.push(`_id IN (${placeholders})`);
    params.push(...assortmentIds);
  }

  if (slugs && slugs.length > 0) {
    // Check if any slug in the JSON array matches using json_each
    const slugConditions = slugs
      .map(() => `EXISTS (SELECT 1 FROM json_each(json_extract(data, '$.slugs')) WHERE value = ?)`)
      .join(' OR ');
    conditions.push(`(${slugConditions})`);
    params.push(...slugs);
  }

  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    // All tags must be present - use json_each for JSON array in data column
    tagArray.forEach((tag) => {
      conditions.push(`EXISTS (SELECT 1 FROM json_each(json_extract(data, '$.tags')) WHERE value = ?)`);
      params.push(tag);
    });
  }

  if (!assortmentSelector && !includeLeaves) {
    conditions.push('is_root = 1');
  }

  if (queryString) {
    // Use FTS5 for full-text search
    // Escape special FTS5 characters and wrap in quotes for phrase search
    const escapedQuery = queryString.replace(/"/g, '""');
    conditions.push(`_id IN (SELECT _id FROM assortments_fts WHERE assortments_fts MATCH ?)`);
    params.push(`"${escapedQuery}"`);
  }

  if (!assortmentSelector && !includeInactive) {
    conditions.push('is_active = 1');
  }

  // Handle custom selector conditions
  if (assortmentSelector) {
    for (const [key, value] of Object.entries(assortmentSelector)) {
      if (key === '_id' && typeof value === 'object' && '$in' in value) {
        const ids = value.$in as string[];
        const placeholders = ids.map(() => '?').join(', ');
        conditions.push(`_id IN (${placeholders})`);
        params.push(...ids);
      } else if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        conditions.push(`${snakeKey} = ?`);
        params.push(value);
      }
    }
  }

  return { where: conditions.join(' AND '), params };
};

const buildOrderBy = (sort?: SortOption[]): string => {
  if (!sort || sort.length === 0) {
    return 'ORDER BY sequence ASC';
  }
  const clauses = sort.map(({ key, value }) => {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    const direction = value === SortDirection.DESC ? 'DESC' : 'ASC';
    return `${snakeKey} ${direction}`;
  });
  return `ORDER BY ${clauses.join(', ')}`;
};

export const configureAssortmentsModule = async (
  moduleInput: ModuleInput<AssortmentsSettingsOptions>,
) => {
  const { db, options: assortmentOptions = {} } = moduleInput;

  if (!db) {
    throw new Error('Database instance is required for configureAssortmentsModule');
  }

  // Initialize schema
  initAssortmentsSchema(db);

  // Events
  registerEvents(ASSORTMENT_EVENTS);

  // Settings - pass db for the product cache
  await assortmentsSettings.configureSettings(assortmentOptions, db);

  // Functions
  const findLinkedAssortments = async (assortment: Assortment): Promise<AssortmentLink[]> => {
    return db.query<AssortmentLink>(
      `SELECT data FROM ${ASSORTMENT_LINKS_TABLE}
       WHERE parent_assortment_id = ? OR child_assortment_id = ?
       ORDER BY sort_key ASC`,
      [assortment._id, assortment._id],
    );
  };

  const findProductAssignments = async (assortmentId: string): Promise<AssortmentProduct[]> => {
    return db.query<AssortmentProduct>(
      `SELECT data FROM ${ASSORTMENT_PRODUCTS_TABLE} WHERE assortment_id = ? ORDER BY sort_key ASC`,
      [assortmentId],
    );
  };

  // returns AssortmentProducts and child assortment links with products.
  const collectProductIdCacheTree = async (assortment: Assortment): Promise<Tree<string>> => {
    const productAssignments = await findProductAssignments(assortment._id);
    const ownProductIds = productAssignments.map(({ productId }) => productId);

    const linkedAssortments = await findLinkedAssortments(assortment);
    const childAssortments = linkedAssortments.filter(
      ({ parentAssortmentId }) => parentAssortmentId === assortment._id,
    );

    const productIds = await Promise.all(
      childAssortments.map(async ({ childAssortmentId }) => {
        const childAssortment = db.queryOne<Assortment>(
          `SELECT data FROM ${ASSORTMENTS_TABLE} WHERE _id = ? AND is_active = 1 AND deleted IS NULL`,
          [childAssortmentId],
        );

        if (childAssortment) {
          return collectProductIdCacheTree(childAssortment);
        }
        return [];
      }),
    );

    return [...ownProductIds, ...productIds];
  };

  const buildProductIds = async (assortment: Assortment) => {
    const collectedProductIdTree = (await collectProductIdCacheTree(assortment)) || [];
    const assortmentSet = new Set<string>(assortmentsSettings.zipTree(collectedProductIdTree));
    return [...assortmentSet];
  };

  const invalidateProductIdCache = async (
    assortment: Assortment,
    cacheOptions: { skipUpstreamTraversal: boolean } = {
      skipUpstreamTraversal: false,
    },
  ) => {
    const productIds = await buildProductIds(assortment);

    let updateCount = await assortmentsSettings.setCachedProductIds(assortment._id, productIds);

    if (cacheOptions.skipUpstreamTraversal || updateCount === 0) return updateCount;

    const linkedAssortments = await findLinkedAssortments(assortment);
    const filteredLinkedAssortments = linkedAssortments.filter(
      ({ childAssortmentId }) => childAssortmentId === assortment._id,
    );

    await Promise.all(
      filteredLinkedAssortments.map(async ({ parentAssortmentId }) => {
        const parent = db.queryOne<Assortment>(
          `SELECT data FROM ${ASSORTMENTS_TABLE} WHERE _id = ? AND is_active = 1 AND deleted IS NULL`,
          [parentAssortmentId],
        );

        if (parent) {
          updateCount += await invalidateProductIdCache(parent, cacheOptions);
        }
        return true;
      }),
    );

    return updateCount;
  };

  const invalidateCache: InvalidateCacheFn = async (selector, options) => {
    logger.debug('Invalidating productId cache for assortments');

    const { where, params } = buildFindSelector({
      includeInactive: true,
      includeLeaves: true,
      ...selector,
    });
    const assortments = db.query<Assortment>(
      `SELECT data FROM ${ASSORTMENTS_TABLE} WHERE ${where}`,
      params,
    );

    const totalInvalidatedAssortments = await assortments.reduce(async (acc, assortment) => {
      const total = await acc;
      const invalidatedAssortments = await invalidateProductIdCache(assortment, options);
      return total + invalidatedAssortments;
    }, Promise.resolve(0));

    logger.debug(
      `Invalidated productId cache for ${totalInvalidatedAssortments} of ${assortments.length} base assortments`,
    );
  };

  /*
   * Assortment sub entities
   */

  const assortmentFilters = configureAssortmentFiltersModule({ db });
  const assortmentLinks = configureAssortmentLinksModule({
    db,
    invalidateCache,
  });
  const assortmentProducts = configureAssortmentProductsModule({
    db,
    invalidateCache,
  });
  const assortmentTexts = configureAssortmentTextsModule({ db });
  const assortmentMedia = await configureAssortmentMediaModule({ db });

  /*
   * Assortment Module
   */

  return {
    findAssortment: async ({ assortmentId, slug }: { assortmentId?: string; slug?: string }) => {
      if (assortmentId) {
        return db.queryOne<Assortment>(`SELECT data FROM ${ASSORTMENTS_TABLE} WHERE _id = ?`, [
          assortmentId,
        ]);
      } else if (slug) {
        // Use json_each to search within slugs JSON array
        return db.queryOne<Assortment>(
          `SELECT data FROM ${ASSORTMENTS_TABLE} WHERE EXISTS (SELECT 1 FROM json_each(json_extract(data, '$.slugs')) WHERE value = ?)`,
          [slug],
        );
      }
      return null;
    },

    findAssortmentIds: async (queryParams: AssortmentQuery): Promise<string[]> => {
      const { where, params } = buildFindSelector(queryParams);
      return db.queryColumn<string>(`SELECT _id FROM ${ASSORTMENTS_TABLE} WHERE ${where}`, params);
    },

    findAssortments: async ({
      limit,
      offset,
      sort,
      ...queryParams
    }: AssortmentQuery & {
      limit?: number;
      offset?: number;
      sort?: SortOption[];
    }): Promise<Assortment[]> => {
      const { where, params } = buildFindSelector(queryParams);
      const orderBy = buildOrderBy(sort || [{ key: 'sequence', value: SortDirection.ASC }]);

      let sql = `SELECT data FROM ${ASSORTMENTS_TABLE} WHERE ${where} ${orderBy}`;
      if (limit !== undefined) {
        sql += ` LIMIT ?`;
        params.push(limit);
      }
      if (offset !== undefined) {
        sql += ` OFFSET ?`;
        params.push(offset);
      }

      return db.query<Assortment>(sql, params);
    },

    findProductIds: async ({
      assortment,
      forceLiveCollection,
      ignoreChildAssortments,
    }: {
      assortment: Assortment;
      forceLiveCollection?: boolean;
      ignoreChildAssortments?: boolean;
    }): Promise<string[]> => {
      if (!assortment) return [];

      if (ignoreChildAssortments) {
        const productAssignments = await findProductAssignments(assortment._id);
        return productAssignments.map(({ productId }) => productId);
      }
      if (!forceLiveCollection) {
        const cachedProductIds = await assortmentsSettings.getCachedProductIds(assortment._id);
        if (cachedProductIds) return cachedProductIds;
      }
      return buildProductIds(assortment);
    },

    children: async ({
      assortmentId,
      includeInactive,
    }: {
      assortmentId: string;
      includeInactive?: boolean;
    }): Promise<Assortment[]> => {
      const childAssortmentIds = db.queryColumn<string>(
        `SELECT child_assortment_id FROM ${ASSORTMENT_LINKS_TABLE}
         WHERE parent_assortment_id = ? ORDER BY sort_key ASC`,
        [assortmentId],
      );

      if (childAssortmentIds.length === 0) return [];

      const placeholders = childAssortmentIds.map(() => '?').join(', ');
      const activeCondition = !includeInactive ? 'AND is_active = 1' : '';

      const assortments = db.query<Assortment>(
        `SELECT data FROM ${ASSORTMENTS_TABLE}
         WHERE _id IN (${placeholders}) AND deleted IS NULL ${activeCondition}`,
        childAssortmentIds,
      );

      // Preserve order from links
      const assortmentMap = new Map<string, Assortment>();
      assortments.forEach((assortment) => {
        assortmentMap.set(assortment._id, assortment);
      });

      return childAssortmentIds.map((id) => assortmentMap.get(id)!).filter(Boolean);
    },

    count: async (queryParams: AssortmentQuery): Promise<number> => {
      const { where, params } = buildFindSelector(queryParams);
      const result = db.queryRaw<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${ASSORTMENTS_TABLE} WHERE ${where}`,
        params,
      );
      return result[0]?.count || 0;
    },

    assortmentExists: async ({
      assortmentId,
    }: {
      assortmentId?: string;
      slug?: string;
    }): Promise<boolean> => {
      return db.exists(ASSORTMENTS_TABLE, { _id: assortmentId, deleted: null });
    },

    breadcrumbs: async (
      params: {
        assortmentId?: string;
        productId?: string;
      },
      {
        resolveAssortmentLinks = async (id: string) => {
          return db.query<AssortmentLink>(
            `SELECT data FROM ${ASSORTMENT_LINKS_TABLE}
             WHERE child_assortment_id = ? ORDER BY sort_key ASC, parent_assortment_id ASC`,
            [id],
          );
        },
        resolveAssortmentProducts = async (id: string) => {
          return db.query<AssortmentProduct>(
            `SELECT data FROM ${ASSORTMENT_PRODUCTS_TABLE}
             WHERE product_id = ? ORDER BY sort_key ASC, product_id ASC`,
            [id],
          );
        },
      }: {
        resolveAssortmentLinks?: BreadcrumbAssortmentLinkFunction;
        resolveAssortmentProducts?: BreadcrumbAssortmentProductFunction;
      },
    ): Promise<{ links: AssortmentPathLink[] }[]> => {
      const buildBreadcrumbs = makeAssortmentBreadcrumbsBuilder({
        resolveAssortmentLinks,
        resolveAssortmentProducts,
      });

      return buildBreadcrumbs(params);
    },

    // Mutations
    create: async ({
      _id,
      isActive = true,
      isBase = false,
      isRoot = false,
      meta = {},
      sequence,
      ...rest
    }: Omit<Assortment, '_id' | 'created'> & Pick<Partial<Assortment>, '_id'>) => {
      const assortmentId = _id || generateId();

      // Delete any soft-deleted assortment with same ID
      if (_id) {
        db.run(`DELETE FROM ${ASSORTMENTS_TABLE} WHERE _id = ? AND deleted IS NOT NULL`, [_id]);
      }

      // Get sequence if not provided
      const finalSequence =
        sequence ??
        (db.queryRaw<{ count: number }>(`SELECT COUNT(*) as count FROM ${ASSORTMENTS_TABLE}`, [])[0]
          ?.count || 0) + 10;

      const now = new Date();
      const { slugs: restSlugs, tags: restTags, ...restWithoutArrays } = rest as any;
      const assortment = db.insert<Assortment>(ASSORTMENTS_TABLE, {
        _id: assortmentId,
        isActive,
        isBase,
        isRoot,
        sequence: finalSequence,
        slugs: restSlugs || [],
        tags: restTags || [],
        meta,
        created: now,
        ...restWithoutArrays,
      } as Assortment);

      await emit('ASSORTMENT_CREATE', { assortment });

      return assortment;
    },

    update: async (
      assortmentId: string,
      doc: Partial<Assortment>,
      options?: { skipInvalidation?: boolean },
    ) => {
      // Check if document exists and is not deleted
      const existing = db.findById<Assortment>(ASSORTMENTS_TABLE, assortmentId);
      if (!existing || existing.deleted) return null;

      const updates = { ...doc, updated: new Date() };
      const assortment = db.update<Assortment>(ASSORTMENTS_TABLE, assortmentId, updates);

      if (!assortment) return null;

      await emit('ASSORTMENT_UPDATE', { assortmentId });

      if (!options?.skipInvalidation) {
        await invalidateCache({ assortmentIds: [assortmentId] });
      }
      return assortment;
    },

    delete: async (assortmentId: string, options?: { skipInvalidation?: boolean }) => {
      await assortmentLinks.deleteMany(
        {
          $or: [{ parentAssortmentId: assortmentId }, { childAssortmentId: assortmentId }],
        },
        { skipInvalidation: true },
      );

      await assortmentProducts.deleteMany({ assortmentId }, { skipInvalidation: true });
      await assortmentFilters.deleteMany({ assortmentId });
      await assortmentTexts.deleteMany({ assortmentId });
      await assortmentMedia.deleteMediaFiles({ assortmentId });

      // Soft delete using document update
      const now = new Date();
      const deletedAssortment = db.update<Assortment>(ASSORTMENTS_TABLE, assortmentId, {
        deleted: now,
        updated: now,
      });

      if (!deletedAssortment) return null;

      if (!options?.skipInvalidation) {
        await invalidateCache({}, { skipUpstreamTraversal: true });
      }

      await emit('ASSORTMENT_REMOVE', { assortmentId });

      return deletedAssortment;
    },

    invalidateCache,

    setBase: async (assortmentId: string): Promise<void> => {
      const now = toSqliteDate(new Date());
      // Reset all to non-base using JSON update
      db.run(
        `UPDATE ${ASSORTMENTS_TABLE} SET data = json_set(data, '$.isBase', false, '$.updated', ?) WHERE is_base = 1`,
        [now],
      );
      // Set the specified one as base
      db.run(
        `UPDATE ${ASSORTMENTS_TABLE} SET data = json_set(data, '$.isBase', true, '$.updated', ?) WHERE _id = ?`,
        [now, assortmentId],
      );
      await emit('ASSORTMENT_SET_BASE', { assortmentId });
    },

    search: {
      findFilteredAssortments: async ({
        limit,
        offset,
        assortmentIds,
        assortmentSelector,
        sort,
      }: {
        assortmentIds: string[];
        assortmentSelector: Record<string, any>;
        limit: number;
        offset: number;
        sort?: { key: string; value: SortDirection }[];
      }): Promise<Assortment[]> => {
        if (assortmentIds.length === 0) return [];

        const placeholders = assortmentIds.map(() => '?').join(', ');
        const params: any[] = [...assortmentIds];

        let sql = `SELECT data FROM ${ASSORTMENTS_TABLE} WHERE _id IN (${placeholders}) AND deleted IS NULL`;

        // Apply selector conditions
        if (assortmentSelector) {
          for (const [key, value] of Object.entries(assortmentSelector)) {
            if (key !== '_id' && value !== undefined) {
              const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
              sql += ` AND ${snakeKey} = ?`;
              params.push(value);
            }
          }
        }

        // Order by preserving the assortmentIds order
        const orderBy = sort ? buildOrderBy(sort) : '';
        if (orderBy) {
          sql += ` ${orderBy}`;
        }

        if (limit !== undefined) {
          sql += ` LIMIT ?`;
          params.push(limit);
        }
        if (offset !== undefined) {
          sql += ` OFFSET ?`;
          params.push(offset);
        }

        const assortments = db.query<Assortment>(sql, params);

        // Preserve order from assortmentIds if no sort specified
        if (!sort) {
          const assortmentMap = new Map<string, Assortment>();
          assortments.forEach((assortment) => {
            assortmentMap.set(assortment._id, assortment);
          });
          return assortmentIds.map((id) => assortmentMap.get(id)!).filter(Boolean);
        }

        return assortments;
      },
    },

    // Sub entities
    media: assortmentMedia,
    filters: assortmentFilters,
    links: assortmentLinks,
    products: assortmentProducts,
    texts: assortmentTexts,

    existingTags: async (): Promise<string[]> => {
      // Use json_each to extract unique tags from all assortments
      return db.queryColumn<string>(
        `SELECT DISTINCT value as tag
         FROM ${ASSORTMENTS_TABLE}, json_each(json_extract(data, '$.tags'))
         WHERE deleted IS NULL
         ORDER BY tag`,
        [],
      );
    },
  };
};

export type AssortmentsModule = Awaited<ReturnType<typeof configureAssortmentsModule>>;
