import { type Tree, type SortOption, SortDirection } from '@unchainedshop/utils';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateId,
  eq,
  and,
  or,
  inArray,
  isNull,
  asc,
  desc,
  sql,
  buildSelectColumns,
  type DrizzleDb,
  type SQL,
} from '@unchainedshop/store';
import { createLogger } from '@unchainedshop/logger';
import {
  assortments,
  assortmentLinks,
  assortmentProducts,
  type Assortment,
  type AssortmentLink,
  type AssortmentProduct,
} from '../db/schema.ts';
import { searchAssortmentsFTS } from '../db/fts.ts';
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

const ASSORTMENT_EVENTS = ['ASSORTMENT_CREATE', 'ASSORTMENT_REMOVE', 'ASSORTMENT_UPDATE'];

export interface AssortmentQuery {
  queryString?: string;
  assortmentIds?: string[];
  includeInactive?: boolean;
  includeLeaves?: boolean;
  slugs?: string[];
  tags?: string[];
}

export type AssortmentFields = keyof Assortment;

export interface AssortmentQueryOptions {
  fields?: AssortmentColumnKeys[];
}

export type InvalidateCacheFn = (
  params: AssortmentQuery,
  options?: { skipUpstreamTraversal: boolean },
) => void;

const COLUMNS = {
  _id: assortments._id,
  isActive: assortments.isActive,
  isRoot: assortments.isRoot,
  sequence: assortments.sequence,
  slugs: assortments.slugs,
  tags: assortments.tags,
  meta: assortments.meta,
  created: assortments.created,
  updated: assortments.updated,
  deleted: assortments.deleted,
} as const;

type AssortmentColumnKeys = keyof typeof COLUMNS;

const SORTABLE_COLUMNS = {
  _id: assortments._id,
  sequence: assortments.sequence,
  isActive: assortments.isActive,
  isRoot: assortments.isRoot,
  created: assortments.created,
  updated: assortments.updated,
} as const;

const buildSortOptions = (sort: SortOption[] = []) => {
  return sort.map((option) => {
    const column = SORTABLE_COLUMNS[option.key as keyof typeof SORTABLE_COLUMNS];
    if (!column) return asc(assortments.sequence);
    return option.value === SortDirection.DESC ? desc(column) : asc(column);
  });
};

export const configureAssortmentsModule = async ({
  db,
  options: assortmentOptions = {},
}: {
  db: DrizzleDb;
  options?: AssortmentsSettingsOptions;
}) => {
  registerEvents(ASSORTMENT_EVENTS);
  assortmentsSettings.configureSettings(assortmentOptions, db);

  const buildFindSelector = async ({
    assortmentIds,
    slugs,
    tags,
    includeLeaves = false,
    includeInactive = false,
    queryString,
  }: AssortmentQuery): Promise<SQL[]> => {
    const conditions: SQL[] = [isNull(assortments.deleted)];

    if (assortmentIds?.length) {
      conditions.push(inArray(assortments._id, assortmentIds));
    }

    if (slugs?.length) {
      // For JSON array field, use json_each to check if any slug matches
      const slugConditions = slugs.map(
        (slug) => sql`EXISTS (SELECT 1 FROM json_each(${assortments.slugs}) WHERE value = ${slug})`,
      );
      conditions.push(or(...slugConditions)!);
    }

    if (tags?.length) {
      // All tags must match
      for (const tag of tags) {
        conditions.push(sql`EXISTS (SELECT 1 FROM json_each(${assortments.tags}) WHERE value = ${tag})`);
      }
    }

    if (!includeLeaves) {
      conditions.push(eq(assortments.isRoot, true));
    }

    if (!includeInactive) {
      conditions.push(eq(assortments.isActive, true));
    }

    if (queryString) {
      const matchingIds = await searchAssortmentsFTS(db, queryString);
      if (matchingIds.length === 0) {
        conditions.push(eq(assortments._id, '__no_match__'));
      } else {
        conditions.push(inArray(assortments._id, matchingIds));
      }
    }

    return conditions;
  };

  const findLinkedAssortments = async (assortment: Assortment): Promise<AssortmentLink[]> => {
    return db
      .select()
      .from(assortmentLinks)
      .where(
        or(
          eq(assortmentLinks.parentAssortmentId, assortment._id),
          eq(assortmentLinks.childAssortmentId, assortment._id),
        ),
      )
      .orderBy(asc(assortmentLinks.sortKey));
  };

  const findProductAssignments = async (assortmentId: string) => {
    return db
      .select()
      .from(assortmentProducts)
      .where(eq(assortmentProducts.assortmentId, assortmentId))
      .orderBy(asc(assortmentProducts.sortKey));
  };

  const collectProductIdCacheTree = async (assortment: Assortment): Promise<Tree<string>> => {
    const productAssignments = await findProductAssignments(assortment._id);
    const ownProductIds = productAssignments.map(({ productId }) => productId);

    const linkedAssortments = await findLinkedAssortments(assortment);
    const childAssortments = linkedAssortments.filter(
      ({ parentAssortmentId }) => parentAssortmentId === assortment._id,
    );

    const productIds = await Promise.all(
      childAssortments.map(async ({ childAssortmentId }) => {
        const [childAssortment] = await db
          .select()
          .from(assortments)
          .where(
            and(
              eq(assortments._id, childAssortmentId),
              eq(assortments.isActive, true),
              isNull(assortments.deleted),
            ),
          )
          .limit(1);

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
    cacheOptions: { skipUpstreamTraversal: boolean } = { skipUpstreamTraversal: false },
  ): Promise<number> => {
    const productIds = await buildProductIds(assortment);
    let updateCount = await assortmentsSettings.setCachedProductIds(assortment._id, productIds);

    if (cacheOptions.skipUpstreamTraversal || updateCount === 0) return updateCount;

    const linkedAssortments = await findLinkedAssortments(assortment);
    const filteredLinkedAssortments = linkedAssortments.filter(
      ({ childAssortmentId }) => childAssortmentId === assortment._id,
    );

    await Promise.all(
      filteredLinkedAssortments.map(async ({ parentAssortmentId }) => {
        const [parent] = await db
          .select()
          .from(assortments)
          .where(
            and(
              eq(assortments._id, parentAssortmentId),
              eq(assortments.isActive, true),
              isNull(assortments.deleted),
            ),
          )
          .limit(1);

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

    const conditions = await buildFindSelector({
      includeInactive: true,
      includeLeaves: true,
      ...selector,
    });
    const assortmentList = await db
      .select()
      .from(assortments)
      .where(and(...conditions));

    const totalInvalidatedAssortments = await assortmentList.reduce(async (acc, assortment) => {
      const total = await acc;
      const invalidatedAssortments = await invalidateProductIdCache(assortment, options);
      return total + invalidatedAssortments;
    }, Promise.resolve(0));

    logger.debug(
      `Invalidated productId cache for ${totalInvalidatedAssortments} of ${assortmentList.length} base assortments`,
    );
  };

  const assortmentFiltersModule = configureAssortmentFiltersModule({ db });
  const assortmentLinksModule = configureAssortmentLinksModule({ db, invalidateCache });
  const assortmentProductsModule = configureAssortmentProductsModule({ db, invalidateCache });
  const assortmentTextsModule = configureAssortmentTextsModule({ db });
  const assortmentMediaModule = configureAssortmentMediaModule({ db });

  return {
    findAssortment: async ({ assortmentId, slug }: { assortmentId?: string; slug?: string }) => {
      if (assortmentId) {
        const [assortment] = await db
          .select()
          .from(assortments)
          .where(eq(assortments._id, assortmentId))
          .limit(1);
        return assortment || null;
      }
      if (slug) {
        const [assortment] = await db
          .select()
          .from(assortments)
          .where(sql`EXISTS (SELECT 1 FROM json_each(${assortments.slugs}) WHERE value = ${slug})`)
          .limit(1);
        return assortment || null;
      }
      return null;
    },

    findAssortmentIds: async (query: AssortmentQuery): Promise<string[]> => {
      const conditions = await buildFindSelector(query);
      const results = await db
        .select({ _id: assortments._id })
        .from(assortments)
        .where(and(...conditions));
      return results.map((r) => r._id);
    },

    findAssortments: async (
      {
        limit,
        offset,
        sort,
        ...query
      }: AssortmentQuery & {
        limit?: number;
        offset?: number;
        sort?: SortOption[];
      },
      options?: AssortmentQueryOptions,
    ): Promise<Assortment[]> => {
      const defaultSortOption: SortOption[] = [{ key: 'sequence', value: SortDirection.ASC }];
      const conditions = await buildFindSelector(query);

      const selectColumns = buildSelectColumns(COLUMNS, options?.fields);
      let queryBuilder = selectColumns
        ? db.select(selectColumns).from(assortments).where(and(...conditions))
        : db.select().from(assortments).where(and(...conditions));

      const sortOptions = buildSortOptions(sort || defaultSortOption);
      if (sortOptions.length > 0) {
        queryBuilder = queryBuilder.orderBy(...sortOptions) as typeof queryBuilder;
      }

      if (offset !== undefined) {
        queryBuilder = queryBuilder.offset(offset) as typeof queryBuilder;
      }

      if (limit !== undefined && limit > 0) {
        queryBuilder = queryBuilder.limit(limit) as typeof queryBuilder;
      }

      const results = await queryBuilder;
      return selectColumns ? (results as Assortment[]) : (results as Assortment[]);
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
      const links = await db
        .select({ childAssortmentId: assortmentLinks.childAssortmentId })
        .from(assortmentLinks)
        .where(eq(assortmentLinks.parentAssortmentId, assortmentId))
        .orderBy(asc(assortmentLinks.sortKey));

      if (!links.length) return [];

      const childIds = links.map((l) => l.childAssortmentId);
      const conditions = [inArray(assortments._id, childIds), isNull(assortments.deleted)];

      if (!includeInactive) {
        conditions.push(eq(assortments.isActive, true));
      }

      const children = await db
        .select()
        .from(assortments)
        .where(and(...conditions));

      // Preserve order from links
      return childIds
        .map((id) => children.find((a) => a._id === id))
        .filter((a): a is Assortment => a !== undefined);
    },

    count: async (query: AssortmentQuery): Promise<number> => {
      const conditions = await buildFindSelector(query);
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(assortments)
        .where(and(...conditions));
      return result?.count || 0;
    },

    assortmentExists: async ({ assortmentId }: { assortmentId?: string }): Promise<boolean> => {
      if (!assortmentId) return false;
      const [result] = await db
        .select({ _id: assortments._id })
        .from(assortments)
        .where(and(eq(assortments._id, assortmentId), isNull(assortments.deleted)))
        .limit(1);
      return !!result;
    },

    breadcrumbs: async (
      params: { assortmentId?: string; productId?: string },
      {
        resolveAssortmentLinks = async (id: string) => {
          return db
            .select()
            .from(assortmentLinks)
            .where(eq(assortmentLinks.childAssortmentId, id))
            .orderBy(asc(assortmentLinks.sortKey), asc(assortmentLinks.parentAssortmentId));
        },
        resolveAssortmentProducts = async (id: string) => {
          return db
            .select()
            .from(assortmentProducts)
            .where(eq(assortmentProducts.productId, id))
            .orderBy(asc(assortmentProducts.sortKey), asc(assortmentProducts.productId));
        },
      }: {
        resolveAssortmentLinks?: BreadcrumbAssortmentLinkFunction;
        resolveAssortmentProducts?: BreadcrumbAssortmentProductFunction;
      } = {},
    ): Promise<{ links: AssortmentPathLink[] }[]> => {
      const buildBreadcrumbs = makeAssortmentBreadcrumbsBuilder({
        resolveAssortmentLinks,
        resolveAssortmentProducts,
      });

      return buildBreadcrumbs(params);
    },

    create: async ({
      _id,
      isActive = true,
      isRoot = false,
      meta = {},
      sequence,
      slugs = [],
      tags = [],
      ...rest
    }: Omit<Assortment, '_id' | 'created'> & Pick<Partial<Assortment>, '_id'>) => {
      const assortmentId = _id || generateId();
      const now = new Date();

      // If recreating with same _id, delete the soft-deleted one first
      if (_id) {
        await db.delete(assortments).where(and(eq(assortments._id, _id), isNull(assortments.deleted)));
      }

      // Get next sequence if not provided
      let seq = sequence;
      if (seq === undefined || seq === null) {
        const [result] = await db.select({ count: sql<number>`count(*)` }).from(assortments);
        seq = (result?.count || 0) + 10;
      }

      await db.insert(assortments).values({
        _id: assortmentId,
        created: now,
        sequence: seq,
        isActive,
        isRoot,
        meta,
        slugs,
        tags,
        ...rest,
      });

      const [assortment] = await db
        .select()
        .from(assortments)
        .where(eq(assortments._id, assortmentId))
        .limit(1);

      // Update FTS
      const slugsText = (assortment.slugs || []).join(' ');
      await db.run(sql`DELETE FROM assortments_fts WHERE _id = ${assortmentId}`);
      await db.run(
        sql`INSERT INTO assortments_fts(_id, slugs_text) VALUES (${assortmentId}, ${slugsText})`,
      );

      await emit('ASSORTMENT_CREATE', { assortment });
      return assortment;
    },

    update: async (
      assortmentId: string,
      doc: Partial<Assortment>,
      options?: { skipInvalidation?: boolean },
    ) => {
      const now = new Date();

      await db
        .update(assortments)
        .set({ ...doc, updated: now })
        .where(eq(assortments._id, assortmentId));

      const [assortment] = await db
        .select()
        .from(assortments)
        .where(eq(assortments._id, assortmentId))
        .limit(1);

      if (!assortment) return null;

      // Update FTS if slugs changed
      if (doc.slugs) {
        const slugsText = (assortment.slugs || []).join(' ');
        await db.run(sql`DELETE FROM assortments_fts WHERE _id = ${assortmentId}`);
        await db.run(
          sql`INSERT INTO assortments_fts(_id, slugs_text) VALUES (${assortmentId}, ${slugsText})`,
        );
      }

      await emit('ASSORTMENT_UPDATE', { assortmentId });

      if (!options?.skipInvalidation) {
        await invalidateCache({ assortmentIds: [assortmentId] });
      }

      return assortment;
    },

    delete: async (assortmentId: string, options?: { skipInvalidation?: boolean }) => {
      await assortmentLinksModule.deleteMany(
        { parentAssortmentId: assortmentId },
        { skipInvalidation: true },
      );
      await assortmentLinksModule.deleteMany(
        { childAssortmentId: assortmentId },
        { skipInvalidation: true },
      );
      await assortmentProductsModule.deleteMany({ assortmentId }, { skipInvalidation: true });
      await assortmentFiltersModule.deleteMany({ assortmentId });
      await assortmentTextsModule.deleteMany({ assortmentId });
      await assortmentMediaModule.deleteMediaFiles({ assortmentId });

      const now = new Date();
      await db.update(assortments).set({ deleted: now }).where(eq(assortments._id, assortmentId));

      const [deletedAssortment] = await db
        .select()
        .from(assortments)
        .where(eq(assortments._id, assortmentId))
        .limit(1);

      if (!deletedAssortment) return null;

      // Remove from FTS
      await db.run(sql`DELETE FROM assortments_fts WHERE _id = ${assortmentId}`);

      if (!options?.skipInvalidation) {
        await invalidateCache({}, { skipUpstreamTraversal: true });
      }

      await emit('ASSORTMENT_REMOVE', { assortmentId });
      return deletedAssortment;
    },

    invalidateCache,

    search: {
      findFilteredAssortments: async ({
        limit,
        offset,
        assortmentIds,
        sort,
        includeInactive,
      }: {
        assortmentIds: string[];
        limit: number;
        offset: number;
        sort?: SortOption[] | Record<string, number>;
        includeInactive?: boolean;
      }): Promise<Assortment[]> => {
        if (!assortmentIds.length) return [];

        const conditions = [inArray(assortments._id, assortmentIds), isNull(assortments.deleted)];
        if (!includeInactive) {
          conditions.push(eq(assortments.isActive, true));
        }

        let queryBuilder = db
          .select()
          .from(assortments)
          .where(and(...conditions));

        // Handle both SortOption[] and SortStage (Record<string, number>) formats
        const sortOptions = Array.isArray(sort) ? buildSortOptions(sort) : [];
        if (sortOptions.length > 0) {
          queryBuilder = queryBuilder.orderBy(...sortOptions) as typeof queryBuilder;
        }

        if (offset) {
          queryBuilder = queryBuilder.offset(offset) as typeof queryBuilder;
        }

        if (limit > 0) {
          queryBuilder = queryBuilder.limit(limit) as typeof queryBuilder;
        }

        const results = await queryBuilder;

        // Preserve order from assortmentIds
        return assortmentIds
          .map((id) => results.find((a) => a._id === id))
          .filter((a): a is Assortment => a !== undefined);
      },
    },

    media: assortmentMediaModule,
    filters: assortmentFiltersModule,
    links: assortmentLinksModule,
    products: assortmentProductsModule,
    texts: assortmentTextsModule,

    existingTags: async (): Promise<string[]> => {
      const results = await db
        .select({ tags: assortments.tags })
        .from(assortments)
        .where(isNull(assortments.deleted));

      const allTags = new Set<string>();
      for (const row of results) {
        if (row.tags) {
          for (const tag of row.tags) {
            if (tag) allTags.add(tag);
          }
        }
      }
      return [...allTags].toSorted();
    },
  };
};

export type AssortmentsModule = Awaited<ReturnType<typeof configureAssortmentsModule>>;
