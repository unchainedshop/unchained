import { emit, registerEvents } from '@unchainedshop/events';
import {
  type Database,
  generateId,
  toSqliteDate,
  toSelectOptions,
  type FindOptions,
} from '@unchainedshop/sqlite';
import { walkUpFromAssortment } from '../utils/breadcrumbs/build-paths.ts';
import {
  type AssortmentLink,
  type InvalidateCacheFn,
  ASSORTMENT_LINKS_TABLE,
} from '../db/AssortmentsCollection.ts';

const ASSORTMENT_LINK_EVENTS = [
  'ASSORTMENT_ADD_LINK',
  'ASSORTMENT_REMOVE_LINK',
  'ASSORTMENT_REORDER_LINKS',
];

export const configureAssortmentLinksModule = ({
  db,
  invalidateCache,
}: {
  db: Database;
  invalidateCache: InvalidateCacheFn;
}) => {
  registerEvents(ASSORTMENT_LINK_EVENTS);

  return {
    // Queries
    findLink: async ({
      assortmentLinkId,
      parentAssortmentId,
      childAssortmentId,
    }: {
      assortmentLinkId?: string;
      parentAssortmentId?: string;
      childAssortmentId?: string;
    }) => {
      if (assortmentLinkId) {
        return db.findById<AssortmentLink>(ASSORTMENT_LINKS_TABLE, assortmentLinkId);
      }
      return db.findOne<AssortmentLink>(ASSORTMENT_LINKS_TABLE, {
        where: { parentAssortmentId, childAssortmentId },
      });
    },

    findLinks: async (
      selector: {
        assortmentId?: string;
        assortmentIds?: string[];
        parentAssortmentId?: string;
        parentAssortmentIds?: string[];
      },
      options?: FindOptions,
    ): Promise<AssortmentLink[]> => {
      const { assortmentId, assortmentIds, parentAssortmentId, parentAssortmentIds } = selector;

      // Build WHERE conditions - need custom SQL for OR conditions
      let sql: string;
      let params: any[];

      if (parentAssortmentId) {
        sql = `SELECT data FROM ${ASSORTMENT_LINKS_TABLE} WHERE parent_assortment_id = ?`;
        params = [parentAssortmentId];
      } else if (parentAssortmentIds && parentAssortmentIds.length > 0) {
        const placeholders = parentAssortmentIds.map(() => '?').join(', ');
        sql = `SELECT data FROM ${ASSORTMENT_LINKS_TABLE} WHERE parent_assortment_id IN (${placeholders})`;
        params = parentAssortmentIds;
      } else if (assortmentId) {
        sql = `SELECT data FROM ${ASSORTMENT_LINKS_TABLE} WHERE parent_assortment_id = ? OR child_assortment_id = ?`;
        params = [assortmentId, assortmentId];
      } else if (assortmentIds && assortmentIds.length > 0) {
        const placeholders = assortmentIds.map(() => '?').join(', ');
        sql = `SELECT data FROM ${ASSORTMENT_LINKS_TABLE} WHERE parent_assortment_id IN (${placeholders}) OR child_assortment_id IN (${placeholders})`;
        params = [...assortmentIds, ...assortmentIds];
      } else {
        return [];
      }

      // Add ORDER BY
      const selectOptions = toSelectOptions(options);
      if (selectOptions.orderBy && selectOptions.orderBy.length > 0) {
        const orderClauses = selectOptions.orderBy.map(
          ({ column, direction }) =>
            `${column.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`)} ${direction || 'ASC'}`,
        );
        sql += ` ORDER BY ${orderClauses.join(', ')}`;
      } else {
        sql += ' ORDER BY sort_key ASC';
      }

      // Add LIMIT/OFFSET
      if (selectOptions.limit !== undefined) {
        sql += ` LIMIT ?`;
        params.push(selectOptions.limit);
      }
      if (selectOptions.offset !== undefined) {
        sql += ` OFFSET ?`;
        params.push(selectOptions.offset);
      }

      return db.query<AssortmentLink>(sql, params);
    },

    // Mutations
    create: async (
      doc: Omit<AssortmentLink, '_id' | 'created' | 'sortKey'> &
        Pick<Partial<AssortmentLink>, '_id' | 'created' | 'sortKey'>,
      options?: { skipInvalidation?: boolean },
    ) => {
      const {
        _id: assortmentLinkId,
        parentAssortmentId,
        childAssortmentId,
        sortKey,
        tags = [],
        meta,
        ...rest
      } = doc;

      // Check for cyclic graph
      const assortmentLinksPath = await walkUpFromAssortment({
        resolveAssortmentLinks: async (id: string) => {
          return db.find<AssortmentLink>(ASSORTMENT_LINKS_TABLE, {
            where: { childAssortmentId: id },
            sort: { sortKey: 1, parentAssortmentId: 1 },
          });
        },
        assortmentId: parentAssortmentId,
      });

      const assortmentIdAlreadyPartOfGraphParents = assortmentLinksPath.some((path) =>
        path.links?.some(
          (l) => l.parentAssortmentId === childAssortmentId || l.childAssortmentId === childAssortmentId,
        ),
      );
      if (assortmentIdAlreadyPartOfGraphParents) throw Error('CyclicGraphNotSupported');

      // Check if exists (upsert behavior)
      const existing = db.findOne<AssortmentLink>(ASSORTMENT_LINKS_TABLE, {
        where: { parentAssortmentId, childAssortmentId },
      });

      const now = new Date();

      if (existing) {
        // Update existing
        const updates: Partial<AssortmentLink> = {
          ...rest,
          tags,
          meta,
          updated: now,
        };
        if (sortKey !== undefined) {
          updates.sortKey = sortKey;
        }
        const assortmentLink = db.update<AssortmentLink>(ASSORTMENT_LINKS_TABLE, existing._id, updates);
        await emit('ASSORTMENT_ADD_LINK', { assortmentLink });

        if (!options?.skipInvalidation) {
          await invalidateCache({ assortmentIds: [parentAssortmentId] });
        }
        return assortmentLink;
      }

      // Get next sort key if not provided
      let finalSortKey = sortKey;
      if (finalSortKey === undefined || finalSortKey === null) {
        const last = db.findOne<AssortmentLink>(ASSORTMENT_LINKS_TABLE, {
          where: { parentAssortmentId },
          sort: { sortKey: -1 },
          limit: 1,
        });
        finalSortKey = (last?.sortKey || 0) + 1;
      }

      const assortmentLink = db.insert<AssortmentLink>(ASSORTMENT_LINKS_TABLE, {
        _id: assortmentLinkId || generateId(),
        parentAssortmentId,
        childAssortmentId,
        sortKey: finalSortKey,
        tags,
        meta,
        created: now,
        ...rest,
      } as AssortmentLink);

      await emit('ASSORTMENT_ADD_LINK', { assortmentLink });

      if (!options?.skipInvalidation) {
        await invalidateCache({ assortmentIds: [parentAssortmentId] });
      }

      return assortmentLink;
    },

    update: async (
      assortmentLinkId: string,
      doc: Partial<AssortmentLink>,
      options?: { skipInvalidation?: boolean },
    ) => {
      const updates = { ...doc, updated: new Date() };
      const assortmentLink = db.update<AssortmentLink>(
        ASSORTMENT_LINKS_TABLE,
        assortmentLinkId,
        updates,
      );

      if (!options?.skipInvalidation && assortmentLink) {
        await invalidateCache({ assortmentIds: [assortmentLink.childAssortmentId] });
      }
      return assortmentLink;
    },

    delete: async (assortmentLinkId: string, options?: { skipInvalidation?: boolean }) => {
      const assortmentLink = db.findById<AssortmentLink>(ASSORTMENT_LINKS_TABLE, assortmentLinkId);
      if (!assortmentLink) return null;

      db.delete(ASSORTMENT_LINKS_TABLE, assortmentLinkId);

      await emit('ASSORTMENT_REMOVE_LINK', {
        assortmentLinkId: assortmentLink._id,
      });

      if (!options?.skipInvalidation) {
        await invalidateCache({
          assortmentIds: [assortmentLink.childAssortmentId, assortmentLink.parentAssortmentId],
        });
      }
      return assortmentLink;
    },

    deleteMany: async (
      selector: {
        _id?: { $nin?: string[] };
        parentAssortmentId?: string;
        childAssortmentId?: string;
        $or?: any[];
      },
      options?: { skipInvalidation?: boolean },
    ) => {
      const conditions: string[] = [];
      const params: any[] = [];

      // Handle _id exclusion
      if (selector._id?.$nin && selector._id.$nin.length > 0) {
        const placeholders = selector._id.$nin.map(() => '?').join(', ');
        conditions.push(`_id NOT IN (${placeholders})`);
        params.push(...selector._id.$nin);
      }

      if (selector.$or) {
        // Handle $or for parent/child deletion
        const orConditions = selector.$or.map((orClause) => {
          const subConditions: string[] = [];
          if (orClause.parentAssortmentId) {
            subConditions.push('parent_assortment_id = ?');
            params.push(orClause.parentAssortmentId);
          }
          if (orClause.childAssortmentId) {
            subConditions.push('child_assortment_id = ?');
            params.push(orClause.childAssortmentId);
          }
          return `(${subConditions.join(' AND ')})`;
        });
        conditions.push(`(${orConditions.join(' OR ')})`);
      } else {
        if (selector.parentAssortmentId) {
          conditions.push('parent_assortment_id = ?');
          params.push(selector.parentAssortmentId);
        }
        if (selector.childAssortmentId) {
          conditions.push('child_assortment_id = ?');
          params.push(selector.childAssortmentId);
        }
      }

      if (conditions.length === 0) return 0;

      const whereClause = conditions.join(' AND ');

      // Get links for events and invalidation
      const assortmentLinks = db.query<AssortmentLink>(
        `SELECT data FROM ${ASSORTMENT_LINKS_TABLE} WHERE ${whereClause}`,
        params,
      );

      const { changes } = db.run(`DELETE FROM ${ASSORTMENT_LINKS_TABLE} WHERE ${whereClause}`, params);

      await Promise.all(
        assortmentLinks.map(async (assortmentLink) =>
          emit('ASSORTMENT_REMOVE_LINK', {
            assortmentLinkId: assortmentLink._id,
          }),
        ),
      );

      if (!options?.skipInvalidation && assortmentLinks.length) {
        await invalidateCache({
          assortmentIds: assortmentLinks.flatMap((link) => [
            link.childAssortmentId,
            link.parentAssortmentId,
          ]),
        });
      }

      return changes;
    },

    updateManualOrder: async (
      {
        sortKeys,
      }: {
        sortKeys: {
          assortmentLinkId: string;
          sortKey: number;
        }[];
      },
      options?: { skipInvalidation?: boolean },
    ): Promise<AssortmentLink[]> => {
      const now = toSqliteDate(new Date());
      const changedAssortmentLinkIds: string[] = [];

      for (const { assortmentLinkId, sortKey } of sortKeys) {
        db.run(
          `UPDATE ${ASSORTMENT_LINKS_TABLE} SET data = json_set(data, '$.sortKey', ?, '$.updated', ?) WHERE _id = ?`,
          [sortKey + 1, now, assortmentLinkId],
        );
        changedAssortmentLinkIds.push(assortmentLinkId);
      }

      if (changedAssortmentLinkIds.length === 0) return [];

      const placeholders = changedAssortmentLinkIds.map(() => '?').join(', ');
      const assortmentLinks = db.query<AssortmentLink>(
        `SELECT data FROM ${ASSORTMENT_LINKS_TABLE} WHERE _id IN (${placeholders})`,
        changedAssortmentLinkIds,
      );

      if (!options?.skipInvalidation && assortmentLinks.length) {
        await invalidateCache({ assortmentIds: assortmentLinks.map((link) => link.childAssortmentId) });
      }

      await emit('ASSORTMENT_REORDER_LINKS', { assortmentLinks });

      return assortmentLinks;
    },
  };
};

export type AssortmentLinksModule = ReturnType<typeof configureAssortmentLinksModule>;
