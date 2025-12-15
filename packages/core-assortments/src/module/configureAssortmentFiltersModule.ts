import { emit, registerEvents } from '@unchainedshop/events';
import {
  type Database,
  generateId,
  toSqliteDate,
  toSelectOptions,
  type FindOptions,
} from '@unchainedshop/sqlite';
import { type AssortmentFilter, ASSORTMENT_FILTERS_TABLE } from '../db/AssortmentsCollection.ts';

const ASSORTMENT_FILTER_EVENTS = [
  'ASSORTMENT_ADD_FILTER',
  'ASSORTMENT_REMOVE_FILTER',
  'ASSORTMENT_REORDER_FILTERS',
];

export const configureAssortmentFiltersModule = ({ db }: { db: Database }) => {
  registerEvents(ASSORTMENT_FILTER_EVENTS);

  return {
    findFilter: async ({ assortmentFilterId }: { assortmentFilterId: string }) => {
      return db.findById<AssortmentFilter>(ASSORTMENT_FILTERS_TABLE, assortmentFilterId);
    },

    findFilters: async (
      selector: {
        assortmentId?: string;
        assortmentIds?: string[];
      },
      options?: FindOptions,
    ): Promise<AssortmentFilter[]> => {
      const where: Record<string, any> = {};

      if (selector.assortmentIds && selector.assortmentIds.length > 0) {
        where.assortmentId = { $in: selector.assortmentIds };
      } else if (selector.assortmentId) {
        where.assortmentId = selector.assortmentId;
      }

      const selectOptions = toSelectOptions(options);
      // Default sort by sortKey if not specified
      if (!selectOptions.orderBy) {
        selectOptions.orderBy = [{ column: 'sortKey', direction: 'ASC' }];
      }

      return db.find<AssortmentFilter>(ASSORTMENT_FILTERS_TABLE, {
        where,
        ...options,
      });
    },

    findFilterIds: async (
      selector: { assortmentId: string },
      options?: FindOptions,
    ): Promise<string[]> => {
      const selectOptions = toSelectOptions(options);
      if (!selectOptions.orderBy) {
        selectOptions.orderBy = [{ column: 'sortKey', direction: 'ASC' }];
      }

      const { sql, params } = db.buildSelect(ASSORTMENT_FILTERS_TABLE, 'filter_id', {
        where: { assortmentId: selector.assortmentId },
        ...selectOptions,
      });

      return db.queryColumn<string>(sql, params);
    },

    create: async (
      doc: Omit<AssortmentFilter, '_id' | 'created' | 'sortKey'> &
        Pick<Partial<AssortmentFilter>, '_id' | 'created' | 'sortKey'>,
    ) => {
      const { _id, assortmentId, filterId, sortKey, tags = [], meta, ...rest } = doc;

      // Check if exists (upsert behavior)
      const existing = db.findOne<AssortmentFilter>(ASSORTMENT_FILTERS_TABLE, {
        where: { assortmentId, filterId },
      });

      const now = new Date();

      if (existing) {
        // Update existing
        const updates: Partial<AssortmentFilter> = {
          ...rest,
          tags,
          meta,
          updated: now,
        };
        if (sortKey !== undefined) {
          updates.sortKey = sortKey;
        }
        const assortmentFilter = db.update<AssortmentFilter>(
          ASSORTMENT_FILTERS_TABLE,
          existing._id,
          updates,
        );
        await emit('ASSORTMENT_ADD_FILTER', { assortmentFilter });
        return assortmentFilter;
      }

      // Get next sort key if not provided
      let finalSortKey = sortKey;
      if (finalSortKey === undefined || finalSortKey === null) {
        const last = db.findOne<AssortmentFilter>(ASSORTMENT_FILTERS_TABLE, {
          where: { assortmentId },
          sort: { sortKey: -1 },
          limit: 1,
        });
        finalSortKey = (last?.sortKey || 0) + 1;
      }

      const assortmentFilter = db.insert<AssortmentFilter>(ASSORTMENT_FILTERS_TABLE, {
        _id: _id || generateId(),
        assortmentId,
        filterId,
        sortKey: finalSortKey,
        tags,
        meta,
        created: now,
        ...rest,
      } as AssortmentFilter);

      await emit('ASSORTMENT_ADD_FILTER', { assortmentFilter });
      return assortmentFilter;
    },

    delete: async (assortmentFilterId: string) => {
      const assortmentFilter = db.findById<AssortmentFilter>(
        ASSORTMENT_FILTERS_TABLE,
        assortmentFilterId,
      );
      if (!assortmentFilter) return null;

      db.delete(ASSORTMENT_FILTERS_TABLE, assortmentFilterId);

      await emit('ASSORTMENT_REMOVE_FILTER', {
        assortmentFilterId: assortmentFilter._id,
      });

      return assortmentFilter;
    },

    deleteMany: async (selector: {
      _id?: { $nin?: string[] };
      assortmentId?: string;
      filterId?: string;
    }): Promise<number> => {
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
      if (selector.filterId) {
        conditions.push('filter_id = ?');
        params.push(selector.filterId);
      }

      if (conditions.length === 0) return 0;

      const whereClause = conditions.join(' AND ');

      // Get IDs for events
      const ids = db.queryColumn<string>(
        `SELECT _id FROM ${ASSORTMENT_FILTERS_TABLE} WHERE ${whereClause}`,
        params,
      );

      const { changes } = db.run(`DELETE FROM ${ASSORTMENT_FILTERS_TABLE} WHERE ${whereClause}`, params);

      await Promise.all(
        ids.map(async (id) =>
          emit('ASSORTMENT_REMOVE_FILTER', {
            assortmentFilterId: id,
          }),
        ),
      );

      return changes;
    },

    update: async (assortmentFilterId: string, doc: Partial<AssortmentFilter>) => {
      const updates = { ...doc, updated: new Date() };
      return db.update<AssortmentFilter>(ASSORTMENT_FILTERS_TABLE, assortmentFilterId, updates);
    },

    updateManualOrder: async ({
      sortKeys,
    }: {
      sortKeys: {
        assortmentFilterId: string;
        sortKey: number;
      }[];
    }): Promise<AssortmentFilter[]> => {
      const now = toSqliteDate(new Date());
      const changedAssortmentFilterIds: string[] = [];

      for (const { assortmentFilterId, sortKey } of sortKeys) {
        db.run(
          `UPDATE ${ASSORTMENT_FILTERS_TABLE} SET data = json_set(data, '$.sortKey', ?, '$.updated', ?) WHERE _id = ?`,
          [sortKey + 1, now, assortmentFilterId],
        );
        changedAssortmentFilterIds.push(assortmentFilterId);
      }

      if (changedAssortmentFilterIds.length === 0) return [];

      const placeholders = changedAssortmentFilterIds.map(() => '?').join(', ');
      const assortmentFilters = db.query<AssortmentFilter>(
        `SELECT data FROM ${ASSORTMENT_FILTERS_TABLE} WHERE _id IN (${placeholders})`,
        changedAssortmentFilterIds,
      );

      await emit('ASSORTMENT_REORDER_FILTERS', { assortmentFilters });

      return assortmentFilters;
    },
  };
};

export type AssortmentFiltersModule = ReturnType<typeof configureAssortmentFiltersModule>;
