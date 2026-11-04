import {
  mongodb,
  generateDbFilterById,
  buildSortOptions,
  generateDbObjectId,
  type ModuleInput,
} from '@unchainedshop/mongodb';
import { getRegisteredEvents } from '@unchainedshop/events';
import {
  SortDirection,
  buildObfuscatedFieldsFilter,
  defaultObfuscatedFields,
  type SortOption,
  type DateFilterInput,
} from '@unchainedshop/utils';
import { EventsCollection, type Event } from '../db/EventsCollection.ts';
import { configureEventHistoryAdapter } from './configureEventHistoryAdapter.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:core-events');

/**
 * Keys redacted in the event history when no `redactedPayloadFields` are configured: the
 * `defaultObfuscatedFields` of `@unchainedshop/utils` and further names of credentials.
 */
export const defaultRedactedPayloadFields = [
  ...defaultObfuscatedFields,
  'plainPassword',
  'hashedToken',
  'refreshToken',
  'idToken',
  'apiKey',
  'clientSecret',
  'privateKey',
];

/**
 * Keys of contact data (e-mail addresses, phone numbers, names and postal addresses), redacted in
 * the event history with `redactContactData`. A key that holds a plain object (`address` of a user
 * profile) is filtered recursively, so its postal address fields are redacted.
 */
export const contactDataPayloadFields = [
  'emailAddress',
  'email',
  'address',
  'recipientEmail',
  'telNumber',
  'phoneMobile',
  'username',
  'userName',
  'displayName',
  'firstName',
  'lastName',
  'company',
  'addressLine',
  'addressLine2',
  'postalCode',
  'city',
];

export interface EventsSettingsOptions {
  /**
   * Keys whose values are replaced with `******` in the payloads written to the `events`
   * collection (event history and `create`), at any depth and case-insensitively. Defaults to
   * `defaultRedactedPayloadFields`; a list replaces them, `[]` stores payloads as emitted.
   * Subscribers and emit adapters always get the payload as emitted.
   */
  redactedPayloadFields?: string[] | null;
  /**
   * Also redact the keys of `contactDataPayloadFields` in the event history. Defaults to false.
   */
  redactContactData?: boolean;
}

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
    selector.$text = { $search: queryString };
  }
  if (created) {
    selector.created = created?.end
      ? { $gte: created.start || new Date(0), $lte: created.end }
      : { $gte: created.start || new Date(0) };
  }
  return selector;
};

export const configureEventsModule = async ({
  db,
  options = {},
}: ModuleInput<EventsSettingsOptions>) => {
  const Events = await EventsCollection(db);
  const redactPayload = buildObfuscatedFieldsFilter([
    ...(options.redactedPayloadFields ?? defaultRedactedPayloadFields),
    ...(options.redactContactData ? contactDataPayloadFields : []),
  ]);

  const create = async (
    doc: Omit<Event, '_id' | 'created'> & Pick<Partial<Event>, '_id' | 'created'>,
  ) => {
    const { payload, ...rest } = doc;
    const result = await Events.insertOne({
      _id: generateDbObjectId(),
      created: new Date(),
      ...rest,
      // Stores a redacted copy, subscribers and emit adapters keep the payload as emitted
      ...(payload ? { payload: redactPayload(payload) } : {}),
    });
    return result.insertedId;
  };

  await configureEventHistoryAdapter(create);

  return {
    create,

    findEvent: async (
      { eventId, ...rest }: mongodb.Filter<Event> & { eventId: string },
      options?: mongodb.FindOptions,
    ) => {
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
    }: { dateRange?: DateFilterInput; types?: string[] } = {}): Promise<EventReport[]> => {
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
          match.$and = conditions;
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
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.type',
            detail: {
              $push: {
                date: '$_id.day',
                count: '$count',
              },
            },
            emitCount: { $sum: '$count' },
          },
        },
        {
          $project: {
            _id: 0,
            type: '$_id',
            emitCount: 1,
            detail: 1,
          },
        },
        { $sort: { type: 1 } },
      ].filter(Boolean) as mongodb.BSON.Document[];

      const report = await Events.aggregate<EventReport>(pipeline).toArray();
      logger.info(report);
      return report ?? [];
    },
  };
};

export type EventsModule = Awaited<ReturnType<typeof configureEventsModule>>;
