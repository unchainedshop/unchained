import type { mongodb } from '@unchainedshop/mongodb';

import { generateDbFilterById, buildSortOptions, generateDbObjectId } from '@unchainedshop/mongodb';
import { getRegisteredEvents } from '@unchainedshop/events';
import { SortDirection, SortOption } from '@unchainedshop/utils';
import { ModuleCreateMutation, ModuleInput } from '@unchainedshop/core';
import { EventsCollection, Event } from '../db/EventsCollection.js';
import { configureEventHistoryAdapter } from './configureEventHistoryAdapter.js';

export type EventReport = {
  emitCount: number;
  type: string;
};

export type EventQuery = {
  types?: Array<string>;
  queryString?: string;
  created?: Date;
};

export const buildFindSelector = ({ types, queryString, created }: EventQuery) => {
  const selector: { type?: any; $text?: any; created?: any } = {};

  if (types && Array.isArray(types)) selector.type = { $in: types };
  if (queryString) selector.$text = { $search: queryString };
  if (created) selector.created = { $gte: created };
  return selector;
};

export interface EventsModule extends ModuleCreateMutation<Event> {
  findEvent: (
    params: mongodb.Filter<Event> & { eventId: string },
    options?: mongodb.FindOptions,
  ) => Promise<Event>;

  findEvents: (
    params: EventQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    options?: mongodb.FindOptions,
  ) => Promise<Array<Event>>;

  type: (event: Event) => string;

  count: (query: EventQuery) => Promise<number>;
  getReport: (params?: { from?: Date; to?: Date; types?: string[] }) => Promise<EventReport[]>;
}

export const configureEventsModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<EventsModule> => {
  const Events = await EventsCollection(db);

  const create = async (doc) => {
    const result = await Events.insertOne({
      _id: generateDbObjectId(),
      created: new Date(),
      ...doc,
    });
    return result.insertedId as string;
  };

  configureEventHistoryAdapter(create);

  return {
    create,

    findEvent: async ({ eventId, ...rest }, options) => {
      const selector = eventId ? generateDbFilterById<Event>(eventId) : rest;
      return Events.findOne(selector, options);
    },

    findEvents: async ({ limit, offset, sort, ...query }) => {
      const defaultSort = [{ key: 'created', value: SortDirection.DESC }] as Array<SortOption>;
      return Events.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || defaultSort),
      }).toArray();
    },

    type: (event) => {
      if (getRegisteredEvents().includes(event.type)) {
        return event.type;
      }
      return 'UNKNOWN';
    },

    count: async (query) => {
      const count = await Events.countDocuments(buildFindSelector(query));
      return count;
    },

    getReport: async ({ from, to, types } = { from: null, to: null, types: null }) => {
      const pipeline = [];
      const matchConditions = [];
      // build date filter based on provided values it can be a range if both to and from is supplied
      // a upper or lowe limit if either from or to is provided
      // or all if none is provided
      if (from || to) {
        const dateConditions = [];
        if (from) {
          const fromDate = new Date(from);
          dateConditions.push({
            $or: [{ created: { $gte: fromDate } }, { updated: { $gte: fromDate } }],
          });
        }
        if (to) {
          const toDate = new Date(to);
          dateConditions.push({
            $or: [{ created: { $lte: toDate } }, { updated: { $lte: toDate } }],
          });
        }
        if (dateConditions.length > 0) {
          matchConditions.push({ $and: dateConditions });
        }
      }
      // build types filter if type is provided or ignore types if it is not provided
      if (types && Array.isArray(types) && types.length) {
        matchConditions.push({ type: { $in: types } });
      }
      if (matchConditions.length > 0) {
        pipeline.push({
          $match: {
            $and: matchConditions,
          },
        });
      }

      pipeline.push(
        ...[
          {
            $group: {
              _id: '$type',
              emitCount: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              type: '$_id',
              emitCount: 1,
            },
          },
        ],
      );

      return Events.aggregate(pipeline).toArray() as Promise<EventReport[]>;
    },
  };
};
