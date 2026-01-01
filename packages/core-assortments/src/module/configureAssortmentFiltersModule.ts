import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateId,
  eq,
  and,
  inArray,
  notInArray,
  asc,
  desc,
  type DrizzleDb,
} from '@unchainedshop/store';
import { SortDirection, type SortOption } from '@unchainedshop/utils';
import { assortmentFilters, type AssortmentFilter } from '../db/schema.ts';

const ASSORTMENT_FILTER_EVENTS = [
  'ASSORTMENT_ADD_FILTER',
  'ASSORTMENT_REMOVE_FILTER',
  'ASSORTMENT_REORDER_FILTERS',
];

export const configureAssortmentFiltersModule = ({ db }: { db: DrizzleDb }) => {
  registerEvents(ASSORTMENT_FILTER_EVENTS);

  return {
    findFilter: async ({ assortmentFilterId }: { assortmentFilterId: string }) => {
      const [result] = await db
        .select()
        .from(assortmentFilters)
        .where(eq(assortmentFilters._id, assortmentFilterId))
        .limit(1);
      return result || null;
    },

    findFilters: async (
      { assortmentId, filterId }: { assortmentId?: string; filterId?: string },
      options?: { limit?: number; offset?: number; sort?: SortOption[] },
    ): Promise<AssortmentFilter[]> => {
      const FILTER_COLUMNS = {
        _id: assortmentFilters._id,
        assortmentId: assortmentFilters.assortmentId,
        filterId: assortmentFilters.filterId,
        sortKey: assortmentFilters.sortKey,
        tags: assortmentFilters.tags,
        meta: assortmentFilters.meta,
        created: assortmentFilters.created,
        updated: assortmentFilters.updated,
      } as const;

      const orderBy = options?.sort?.length
        ? options.sort.map(({ key, value }) => {
            const column =
              FILTER_COLUMNS[key as keyof typeof FILTER_COLUMNS] ?? assortmentFilters.sortKey;
            return value === SortDirection.DESC ? desc(column) : asc(column);
          })
        : [asc(assortmentFilters.sortKey)];

      const conditions: ReturnType<typeof eq>[] = [];
      if (assortmentId) {
        conditions.push(eq(assortmentFilters.assortmentId, assortmentId));
      }
      if (filterId) {
        conditions.push(eq(assortmentFilters.filterId, filterId));
      }

      let query =
        conditions.length === 0
          ? db
              .select()
              .from(assortmentFilters)
              .orderBy(...orderBy)
          : db
              .select()
              .from(assortmentFilters)
              .where(and(...conditions))
              .orderBy(...orderBy);

      if (options?.limit) {
        query = query.limit(options.limit) as typeof query;
      }
      if (options?.offset) {
        query = query.offset(options.offset) as typeof query;
      }

      return query;
    },

    findFilterIds: async ({ assortmentId }: { assortmentId: string }): Promise<string[]> => {
      const results = await db
        .select({ filterId: assortmentFilters.filterId })
        .from(assortmentFilters)
        .where(eq(assortmentFilters.assortmentId, assortmentId))
        .orderBy(asc(assortmentFilters.sortKey));

      return results.map((r) => r.filterId);
    },

    create: async (
      doc: Omit<AssortmentFilter, '_id' | 'created' | 'sortKey' | 'meta' | 'updated'> &
        Partial<Pick<AssortmentFilter, '_id' | 'created' | 'sortKey' | 'meta' | 'updated'>>,
    ) => {
      const { _id, assortmentId, filterId, sortKey, tags = [], ...rest } = doc;
      const now = new Date();

      // Check if already exists
      const [existing] = await db
        .select()
        .from(assortmentFilters)
        .where(
          and(
            eq(assortmentFilters.assortmentId, assortmentId),
            eq(assortmentFilters.filterId, filterId),
          ),
        )
        .limit(1);

      if (existing) {
        // Update existing
        const updateData: Partial<AssortmentFilter> = {
          ...rest,
          tags,
          updated: now,
        };
        if (sortKey !== undefined && sortKey !== null) {
          updateData.sortKey = sortKey;
        }

        await db
          .update(assortmentFilters)
          .set(updateData)
          .where(eq(assortmentFilters._id, existing._id));

        const [updated] = await db
          .select()
          .from(assortmentFilters)
          .where(eq(assortmentFilters._id, existing._id))
          .limit(1);

        await emit('ASSORTMENT_ADD_FILTER', { assortmentFilter: updated });
        return updated;
      }

      // Get next sort key if not provided
      let newSortKey = sortKey;
      if (newSortKey === undefined || newSortKey === null) {
        const [lastFilter] = await db
          .select({ sortKey: assortmentFilters.sortKey })
          .from(assortmentFilters)
          .where(eq(assortmentFilters.assortmentId, assortmentId))
          .orderBy(desc(assortmentFilters.sortKey))
          .limit(1);
        newSortKey = (lastFilter?.sortKey || 0) + 1;
      }

      const assortmentFilterId = _id || generateId();
      await db.insert(assortmentFilters).values({
        _id: assortmentFilterId,
        assortmentId,
        filterId,
        sortKey: newSortKey,
        tags,
        created: now,
        ...rest,
      });

      const [assortmentFilter] = await db
        .select()
        .from(assortmentFilters)
        .where(eq(assortmentFilters._id, assortmentFilterId))
        .limit(1);

      await emit('ASSORTMENT_ADD_FILTER', { assortmentFilter });
      return assortmentFilter;
    },

    delete: async (assortmentFilterId: string) => {
      const [assortmentFilter] = await db
        .select()
        .from(assortmentFilters)
        .where(eq(assortmentFilters._id, assortmentFilterId))
        .limit(1);

      if (!assortmentFilter) return null;

      await db.delete(assortmentFilters).where(eq(assortmentFilters._id, assortmentFilterId));

      await emit('ASSORTMENT_REMOVE_FILTER', {
        assortmentFilterId: assortmentFilter._id,
      });

      return assortmentFilter;
    },

    deleteMany: async (selector: {
      assortmentId?: string;
      filterId?: string;
      excludeIds?: string[];
    }): Promise<number> => {
      const conditions: ReturnType<typeof eq>[] = [];

      if (selector.assortmentId) {
        conditions.push(eq(assortmentFilters.assortmentId, selector.assortmentId));
      }
      if (selector.filterId) {
        conditions.push(eq(assortmentFilters.filterId, selector.filterId));
      }
      if (selector.excludeIds?.length) {
        conditions.push(notInArray(assortmentFilters._id, selector.excludeIds));
      }

      if (conditions.length === 0) return 0;

      // Get filters before deleting for events
      const filtersToDelete = await db
        .select({ _id: assortmentFilters._id })
        .from(assortmentFilters)
        .where(and(...conditions));

      if (filtersToDelete.length === 0) return 0;

      const result = await db.delete(assortmentFilters).where(and(...conditions));

      await Promise.all(
        filtersToDelete.map(async (f) =>
          emit('ASSORTMENT_REMOVE_FILTER', {
            assortmentFilterId: f._id,
          }),
        ),
      );

      return result.rowsAffected;
    },

    update: async (assortmentFilterId: string, doc: Partial<AssortmentFilter>) => {
      const now = new Date();

      await db
        .update(assortmentFilters)
        .set({ ...doc, updated: now })
        .where(eq(assortmentFilters._id, assortmentFilterId));

      const [result] = await db
        .select()
        .from(assortmentFilters)
        .where(eq(assortmentFilters._id, assortmentFilterId))
        .limit(1);

      return result || null;
    },

    updateManualOrder: async ({
      sortKeys,
    }: {
      sortKeys: {
        assortmentFilterId: string;
        sortKey: number;
      }[];
    }): Promise<AssortmentFilter[]> => {
      const now = new Date();
      const changedAssortmentFilterIds = await Promise.all(
        sortKeys.map(async ({ assortmentFilterId, sortKey }) => {
          await db
            .update(assortmentFilters)
            .set({
              sortKey: sortKey + 1,
              updated: now,
            })
            .where(eq(assortmentFilters._id, assortmentFilterId));
          return assortmentFilterId;
        }),
      );

      const updatedFilters = await db
        .select()
        .from(assortmentFilters)
        .where(inArray(assortmentFilters._id, changedAssortmentFilterIds));

      await emit('ASSORTMENT_REORDER_FILTERS', { assortmentFilters: updatedFilters });

      return updatedFilters;
    },
  };
};

export type AssortmentFiltersModule = ReturnType<typeof configureAssortmentFiltersModule>;
