import {
  mongodb,
  generateDbFilterById,
  buildSortOptions,
  generateDbObjectId,
  ModuleInput,
  assertDocumentDBCompatMode,
} from '@unchainedshop/mongodb';
import { getRegisteredEvents } from '@unchainedshop/events';
import { SortDirection, SortOption, DateFilterInput } from '@unchainedshop/utils';
import { EventsCollection, Event } from '../db/EventsCollection.js';
import { configureEventHistoryAdapter } from './configureEventHistoryAdapter.js';

export interface EventReport {
  emitCount: number;
  type: string;
}

export interface EventQuery {
  types?: string[];
  queryString?: string;
  created?: { end?: Date; start?: Date };
}

export const buildFindSelector = ({ types, queryString, created }: EventQuery) => {
  const selector: { type?: any; $text?: any; created?: any } = {};

  if (types && Array.isArray(types)) selector.type = { $in: types };
  if (queryString) {
    assertDocumentDBCompatMode();
    selector.$text = { $search: queryString };
  }
  if (created) {
    selector.created = created?.end
      ? { $gte: created.start || new Date(0), $lte: created.end }
      : { $gte: created.start || new Date(0) };
  }
  return selector;
};

export const configureEventsModule = async ({ db }: ModuleInput<Record<string, never>>) => {
  const Events = await EventsCollection(db);

  const create = async (doc: Event) => {
    const result = await Events.insertOne({
      _id: generateDbObjectId(),
      created: new Date(),
      ...doc,
    });
    return result.insertedId;
  };

  await configureEventHistoryAdapter(create);

  return {
    create,

    findEvent: async (
      { eventId, ...rest }: mongodb.Filter<Event> & { eventId: string },
      options?: mongodb.FindOptions,
    ): Promise<Event> => {
      const selector = eventId ? generateDbFilterById<Event>(eventId) : rest;
      return Events.findOne(selector, options);
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
      const defaultSort = [{ key: 'created', value: SortDirection.DESC }] as SortOption[];
      return Events.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || defaultSort),
      }).toArray();
    },

    type: (event: Event) => {
      if (getRegisteredEvents().includes(event.type)) {
        return event.type;
      }
      return 'UNKNOWN';
    },

    count: async (query: EventQuery) => {
      const count = await Events.countDocuments(buildFindSelector(query));
      return count;
    },

    getReport: async ({
      dateRange,
      types,
    }: { dateRange?: DateFilterInput; types?: string[] } = {}): Promise<{
      report: EventReport[];
      total: number;
    }> => {
      const match: any = {};

      if (dateRange?.start || dateRange?.end) {
        const conditions: any[] = [];
        if (dateRange.start) {
          const fromDate = new Date(dateRange.start);
          conditions.push({ created: { $gte: fromDate } });
        }
        if (dateRange.end) {
          const toDate = new Date(dateRange.end);
          conditions.push({ created: { $lte: toDate } });
        }
        if (conditions.length) {
          match.$or = conditions;
        }
      }

      if (types?.length) {
        match.type = { $in: types };
      }

      const pipeline = [
        Object.keys(match).length ? { $match: match } : null,
        {
          $group: {
            _id: {
              type: '$type',
              day: {
                $dateToString: { format: '%Y-%m-%d', date: '$created' },
              },
            },
            emitCount: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.type',
            detail: {
              $push: {
                date: '$_id.day',
                emitCount: '$emitCount',
              },
            },
            total: { $sum: '$emitCount' },
          },
        },
        {
          $project: {
            _id: 0,
            type: '$_id',
            total: 1,
            detail: 1,
          },
        },
        { $sort: { type: 1 } },
        {
          $group: {
            _id: null,
            report: { $push: '$$ROOT' },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            report: 1,
            total: 1,
          },
        },
      ].filter(Boolean);

      const [report] = await Events.aggregate<{ report: EventReport[]; total: number }>(
        pipeline,
      ).toArray();
      return report ?? { report: [], total: 0 };
    },
  };
};

export type EventsModule = Awaited<ReturnType<typeof configureEventsModule>>;
