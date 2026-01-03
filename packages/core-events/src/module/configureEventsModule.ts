/**
 * Events Module - Drizzle ORM with SQLite/Turso
 */

import { getRegisteredEvents } from '@unchainedshop/events';
import { SortDirection, type SortOption, type DateFilterInput } from '@unchainedshop/utils';
import {
  eq,
  and,
  inArray,
  sql,
  asc,
  desc,
  gte,
  lte,
  lt,
  generateId,
  type SQL,
  type DrizzleDb,
} from '@unchainedshop/store';
import { events, type EventRow } from '../db/schema.ts';
import { configureEventHistoryAdapter } from './configureEventHistoryAdapter.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:core-events');

const TWO_DAYS_MS = 172800000;

export interface Event {
  _id: string;
  type: string;
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  created: Date;
}

export interface EventReport {
  emitCount: number;
  type: string;
  detail?: { date: string; count: number }[];
}

export interface EventQuery {
  types?: string[];
  created?: { end?: Date; start?: Date };
  eventIds?: string[];
  searchEventIds?: string[];
}

const rowToEvent = (row: EventRow): Event => ({
  _id: row._id,
  type: row.type,
  context: row.context ?? undefined,
  payload: row.payload ?? undefined,
  created: row.created,
});

const COLUMNS = {
  _id: events._id,
  type: events.type,
  context: events.context,
  payload: events.payload,
  created: events.created,
} as const;

export const configureEventsModule = async ({ db }: { db: DrizzleDb }) => {
  // Build filter conditions from query params
  const buildConditions = async (query: EventQuery): Promise<SQL[]> => {
    const conditions: SQL[] = [];

    if (query.types?.length) {
      conditions.push(inArray(events.type, query.types));
    }

    if (query.created) {
      if (query.created.start) {
        conditions.push(gte(events.created, query.created.start));
      }
      if (query.created.end) {
        conditions.push(lte(events.created, query.created.end));
      }
    }

    if (query.eventIds?.length) {
      conditions.push(inArray(events._id, query.eventIds));
    }

    if (query.searchEventIds?.length) {
      conditions.push(inArray(events._id, query.searchEventIds));
    }

    return conditions;
  };

  // Build sort expressions from query params
  const buildOrderBy = (sort?: SortOption[]) => {
    const defaultSort = [{ key: 'created', value: SortDirection.DESC }] as SortOption[];
    const effectiveSort = sort?.length ? sort : defaultSort;
    return effectiveSort.map((s) => {
      const column = COLUMNS[s.key as keyof typeof COLUMNS] ?? events.created;
      return s.value === SortDirection.DESC ? desc(column) : asc(column);
    });
  };

  const create = async (
    doc: Omit<Event, '_id' | 'created'> & Pick<Partial<Event>, '_id' | 'created'>,
  ): Promise<string> => {
    const eventId = doc._id || generateId();
    await db.insert(events).values({
      _id: eventId,
      type: doc.type,
      context: doc.context,
      payload: doc.payload,
      created: doc.created || new Date(),
    });
    return eventId;
  };

  await configureEventHistoryAdapter(create);

  return {
    create,

    findEvent: async ({ eventId }: { eventId: string }): Promise<Event | null> => {
      const [row] = await db.select().from(events).where(eq(events._id, eventId)).limit(1);
      return row ? rowToEvent(row) : null;
    },

    findEvents: async ({
      limit,
      offset,
      sort,
      ...query
    }: EventQuery & {
      limit?: number;
      offset?: number;
      sort?: SortOption[];
    }): Promise<Event[]> => {
      const conditions = await buildConditions(query);
      const orderBy = buildOrderBy(sort);

      let baseQuery = db.select().from(events);

      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions)) as typeof baseQuery;
      }

      const results = await baseQuery
        .orderBy(...orderBy)
        .limit(limit ?? 1000)
        .offset(offset ?? 0);

      return results.map(rowToEvent);
    },

    type: (event: Event) => {
      if (getRegisteredEvents().includes(event.type)) {
        return event.type;
      }
      return 'UNKNOWN';
    },

    count: async (query: EventQuery): Promise<number> => {
      const conditions = await buildConditions(query);

      let countQuery = db.select({ count: sql<number>`count(*)` }).from(events);

      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions)) as typeof countQuery;
      }

      const [{ count }] = await countQuery;
      return count ?? 0;
    },

    getReport: async ({
      dateRange,
      types,
    }: { dateRange?: DateFilterInput; types?: string[] } = {}): Promise<EventReport[]> => {
      const conditions: SQL[] = [];

      if (types?.length) {
        conditions.push(inArray(events.type, types));
      }

      if (dateRange?.start) {
        conditions.push(gte(events.created, new Date(dateRange.start)));
      }
      if (dateRange?.end) {
        conditions.push(lte(events.created, new Date(dateRange.end)));
      }

      // Use raw SQL for the aggregation query with strftime
      const whereClause = conditions.length > 0 ? sql`WHERE ${and(...conditions)}` : sql``;

      const rows = await db.all<{ type: string; date: string; count: number }>(sql`
        SELECT
          type,
          strftime('%Y-%m-%d', created/1000, 'unixepoch') as date,
          COUNT(*) as count
        FROM events
        ${whereClause}
        GROUP BY type, date
        ORDER BY type, date
      `);

      // Transform to expected format: group by type
      const reportMap = new Map<
        string,
        { type: string; emitCount: number; detail: { date: string; count: number }[] }
      >();

      for (const row of rows) {
        if (!reportMap.has(row.type)) {
          reportMap.set(row.type, { type: row.type, emitCount: 0, detail: [] });
        }
        const entry = reportMap.get(row.type)!;
        entry.emitCount += row.count;
        entry.detail.push({ date: row.date, count: row.count });
      }

      const report = Array.from(reportMap.values()).sort((a, b) => a.type.localeCompare(b.type));
      logger.info(report);
      return report;
    },

    /**
     * Delete events older than maxAgeMs (default 2 days).
     * This replaces the MongoDB TTL index behavior.
     */
    deleteOld: async (maxAgeMs = TWO_DAYS_MS): Promise<number> => {
      const cutoff = new Date(Date.now() - maxAgeMs);
      const result = await db.delete(events).where(lt(events.created, cutoff));
      return result.rowsAffected;
    },
  };
};

export type EventsModule = Awaited<ReturnType<typeof configureEventsModule>>;
