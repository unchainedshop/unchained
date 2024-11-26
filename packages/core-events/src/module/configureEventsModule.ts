import { generateDbFilterById, generateDbMutations, buildSortOptions } from '@unchainedshop/mongodb';
import { getRegisteredEvents } from '@unchainedshop/events';
import { SortDirection, SortOption } from '@unchainedshop/types/api.js';
import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core.js';
import { EventsCollection, Event } from '../db/EventsCollection.js';
import { EventsSchema } from '../db/EventsSchema.js';
import { configureEventHistoryAdapter } from './configureEventHistoryAdapter.js';
import { EventReport, EventsModule } from '@unchainedshop/types/events.js';

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

    getReport: async ({ dateRange, types } = { dateRange: {}, types: null }) => {
      const pipeline = [];
      const matchConditions = [];
      // build date filter based on provided values it can be a range if both to and from is supplied
      // a upper or lowe limit if either from or to is provided
      // or all if none is provided
      if (dateRange?.start || dateRange?.end) {
        const dateConditions = [];
        if (dateRange?.start) {
          const fromDate = new Date(dateRange?.start);
          dateConditions.push({
            $or: [{ created: { $gte: fromDate } }, { updated: { $gte: fromDate } }],
          });
        }
        if (dateRange?.end) {
          const toDate = new Date(dateRange?.end);
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
