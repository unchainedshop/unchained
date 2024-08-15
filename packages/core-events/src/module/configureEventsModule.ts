import type { mongodb } from '@unchainedshop/mongodb';

import { generateDbFilterById, generateDbMutations, buildSortOptions } from '@unchainedshop/mongodb';
import { getRegisteredEvents } from '@unchainedshop/events';
import { SortDirection, SortOption } from '@unchainedshop/types/api.js';
import { ModuleCreateMutation, ModuleInput, ModuleMutations } from '@unchainedshop/types/core.js';
import { EventsCollection, Event } from '../db/EventsCollection.js';
import { EventsSchema } from '../db/EventsSchema.js';
import { configureEventHistoryAdapter } from './configureEventHistoryAdapter.js';
import { EventReport } from '@unchainedshop/types/events.js';

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
  getReport: (params?: { from: Date }) => Promise<EventReport[]>;
}

export const configureEventsModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<EventsModule> => {
  const Events = await EventsCollection(db);

  const mutations = generateDbMutations<Event>(Events, EventsSchema, {
    hasCreateOnly: true,
  }) as ModuleMutations<Event>;

  configureEventHistoryAdapter(mutations);

  return {
    ...mutations,
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
    getReport: async ({ from }) => {
      const pipeline = [];
      if (from) {
        const date = new Date(from);
        pipeline.push({
          $match: {
            $or: [{ created: { $gte: date } }, { updated: { $gte: date } }],
          },
        });
      }
      pipeline.push(
        ...[
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              type: '$_id',
              count: 1,
            },
          },
        ],
      );

      return Events.aggregate(pipeline).toArray() as Promise<EventReport[]>;
    },
  };
};
