import { emit, registerEvents } from '@unchainedshop/events';
import { SortDirection, type SortOption } from '@unchainedshop/utils';
import { generateId, eq, and, inArray, asc, desc, type DrizzleDb, type SQL } from '@unchainedshop/store';
import { filters, FilterType, type Filter } from '../db/schema.ts';
import { configureFilterTextsModule } from './configureFilterTextsModule.ts';
import createFilterValueParser from '../filter-value-parsers/index.ts';
import { filtersSettings, type FiltersSettingsOptions } from '../filters-settings.ts';
import type { FilterQuery } from '../search.ts';
import { searchFiltersFTS } from '../db/fts.ts';

export type FilterOption = Filter & {
  filterOption: string;
};

const FILTER_EVENTS = ['FILTER_CREATE', 'FILTER_REMOVE', 'FILTER_UPDATE'];

const SORTABLE_COLUMNS = {
  _id: filters._id,
  key: filters.key,
  type: filters.type,
  isActive: filters.isActive,
  created: filters.created,
  updated: filters.updated,
} as const;

const buildSortOptions = (sort: SortOption[] = []) => {
  return sort.map((option) => {
    const column = SORTABLE_COLUMNS[option.key as keyof typeof SORTABLE_COLUMNS];
    if (!column) return asc(filters.created);
    return option.value === SortDirection.DESC ? desc(column) : asc(column);
  });
};

// Extended query type to handle MongoDB-style selectors from loadFiltersService
interface ExtendedFilterQuery extends FilterQuery {
  _id?: string | { $in: string[] };
  key?: string | { $in: string[] };
  isActive?: boolean;
}

export const buildFindSelector = async (db: DrizzleDb, query: ExtendedFilterQuery): Promise<SQL[]> => {
  const { includeInactive = false, queryString, filterIds, _id, key, isActive, ...rest } = query;
  void rest;
  void isActive; // MongoDB-style selector property, ignored when includeInactive is set
  const conditions: SQL[] = [];

  // Handle active filter status:
  // - If includeInactive is true, include all filters (ignore isActive)
  // - If includeInactive is false (default), only include active filters
  if (!includeInactive) {
    conditions.push(eq(filters.isActive, true));
  }

  // Handle filterIds array
  if (filterIds?.length) {
    conditions.push(inArray(filters._id, filterIds));
  }

  // Handle MongoDB-style _id: { $in: [...] } or _id: 'string'
  if (_id) {
    if (typeof _id === 'string') {
      conditions.push(eq(filters._id, _id));
    } else if (_id.$in?.length) {
      conditions.push(inArray(filters._id, _id.$in));
    }
  }

  // Handle MongoDB-style key: { $in: [...] } or key: 'string'
  if (key) {
    if (typeof key === 'string') {
      conditions.push(eq(filters.key, key));
    } else if (key.$in?.length) {
      conditions.push(inArray(filters.key, key.$in));
    }
  }

  if (queryString) {
    const matchingIds = await searchFiltersFTS(db, queryString);
    if (matchingIds.length === 0) {
      // No matches - force empty result
      conditions.push(eq(filters._id, '__no_match__'));
    } else {
      conditions.push(inArray(filters._id, matchingIds));
    }
  }

  return conditions;
};

export const configureFiltersModule = async ({
  db,
  options: filtersOptions = {},
}: {
  db: DrizzleDb;
  options?: FiltersSettingsOptions;
}) => {
  registerEvents(FILTER_EVENTS);

  // Settings
  await filtersSettings.configureSettings(filtersOptions, db);

  const filterTextsModule = configureFilterTextsModule({
    db,
  });

  return {
    // Queries
    findFilter: async (params: { filterId: string } | { key: string }) => {
      let result;
      if ('key' in params) {
        result = await db.select().from(filters).where(eq(filters.key, params.key)).limit(1);
      } else {
        result = await db.select().from(filters).where(eq(filters._id, params.filterId)).limit(1);
      }
      return result[0] || null;
    },

    findFilters: async ({
      limit,
      offset,
      sort,
      ...query
    }: FilterQuery & {
      limit?: number;
      offset?: number;
      sort?: SortOption[];
    }): Promise<Filter[]> => {
      const defaultSortOption = [{ key: 'created', value: SortDirection.ASC }];
      const conditions = await buildFindSelector(db, query);

      let queryBuilder = db.select().from(filters);

      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions)) as typeof queryBuilder;
      }

      const sortOptions = buildSortOptions(sort || defaultSortOption);
      if (sortOptions.length > 0) {
        queryBuilder = queryBuilder.orderBy(...sortOptions) as typeof queryBuilder;
      }

      if (offset !== undefined) {
        queryBuilder = queryBuilder.offset(offset) as typeof queryBuilder;
      }

      // In MongoDB, limit(0) means no limit. In Drizzle, .limit(0) returns 0 rows.
      // So only apply limit if it's greater than 0.
      if (limit !== undefined && limit > 0) {
        queryBuilder = queryBuilder.limit(limit) as typeof queryBuilder;
      }

      return queryBuilder;
    },

    count: async (query: FilterQuery): Promise<number> => {
      const conditions = await buildFindSelector(db, query);

      let queryBuilder = db.select().from(filters);

      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions)) as typeof queryBuilder;
      }

      const result = await queryBuilder;
      return result.length;
    },

    filterExists: async ({ filterId }: { filterId: string }) => {
      const result = await db.select().from(filters).where(eq(filters._id, filterId)).limit(1);

      return result.length > 0;
    },

    // Mutations
    create: async ({
      type,
      isActive = false,
      options = [],
      ...filterData
    }: {
      type: Filter['type'];
      key: Filter['key'];
      isActive?: boolean | null;
      options?: string[] | null;
      meta?: Record<string, unknown> | null;
      _id?: string;
      created?: Date;
      updated?: Date | null;
    }): Promise<Filter> => {
      const filterId = filterData._id || generateId();
      const now = new Date();

      await db.insert(filters).values({
        _id: filterId,
        created: filterData.created || now,
        isActive,
        type: FilterType[type],
        options,
        ...filterData,
      });

      const [filter] = await db.select().from(filters).where(eq(filters._id, filterId)).limit(1);

      await emit('FILTER_CREATE', { filter });
      return filter;
    },

    parse: (filter: Filter, values: any[], allKeys: string[]) => {
      const parse = createFilterValueParser(filter.type);
      return parse(values, allKeys);
    },

    createFilterOption: async (filterId: string, { value }: { value: string }) => {
      const [existingFilter] = await db.select().from(filters).where(eq(filters._id, filterId)).limit(1);

      if (!existingFilter) return null;

      const currentOptions = existingFilter.options || [];
      if (!currentOptions.includes(value)) {
        const newOptions = [...currentOptions, value];
        const now = new Date();

        await db
          .update(filters)
          .set({
            options: newOptions,
            updated: now,
          })
          .where(eq(filters._id, filterId));

        const [updatedFilter] = await db
          .select()
          .from(filters)
          .where(eq(filters._id, filterId))
          .limit(1);

        await emit('FILTER_UPDATE', {
          filterId,
          options: updatedFilter.options,
          updated: updatedFilter.updated,
        });
        return updatedFilter;
      }

      return existingFilter;
    },

    delete: async (filterId: string) => {
      await filterTextsModule.deleteMany({ filterId });
      const result = await db.delete(filters).where(eq(filters._id, filterId));
      await emit('FILTER_REMOVE', { filterId });
      return result.rowsAffected || 0;
    },

    removeFilterOption: async ({
      filterId,
      filterOptionValue,
    }: {
      filterId: string;
      filterOptionValue?: string;
    }) => {
      const [existingFilter] = await db.select().from(filters).where(eq(filters._id, filterId)).limit(1);

      if (!existingFilter) return null;

      const currentOptions = existingFilter.options || [];
      const newOptions = currentOptions.filter((opt) => opt !== filterOptionValue);
      const now = new Date();

      await db
        .update(filters)
        .set({
          options: newOptions,
          updated: now,
        })
        .where(eq(filters._id, filterId));

      const [updatedFilter] = await db.select().from(filters).where(eq(filters._id, filterId)).limit(1);

      await emit('FILTER_UPDATE', {
        filterId,
        options: updatedFilter.options,
        updated: updatedFilter.updated,
      });
      return updatedFilter;
    },

    update: async (filterId: string, doc: Partial<Filter>) => {
      const now = new Date();

      await db
        .update(filters)
        .set({
          ...doc,
          updated: now,
        })
        .where(eq(filters._id, filterId));

      const [filter] = await db.select().from(filters).where(eq(filters._id, filterId)).limit(1);

      if (!filter) return null;

      await emit('FILTER_UPDATE', { filterId: filter._id, ...filter });
      return filter;
    },

    texts: filterTextsModule,
  };
};

export type FiltersModule = Awaited<ReturnType<typeof configureFiltersModule>>;
