import { EventsModule } from 'unchained-core-types';
import { EventsSchema } from '../db/EventsSchema';
import { configureEventDirector } from '../director/EventDirector';
import { checkId } from 'unchained-utils';
import { ModuleInput } from '../../../@types/unchained-core-types/types/common';

type FindQuery = {
  type?: string;
};
const buildFindSelector = ({ type }: FindQuery) => {
  return type ? { type } : {};
};

export const configureEventsModule = ({
  db,
  userId,
}: ModuleInput): EventsModule => {
  const Events = new db.Collection('events');

  return {
    ...configureEventDirector(Events),
    findEvent: async ({ eventId, ...rest }, options) => {
      const selector = eventId ? { _id: eventId } : rest;
      if (!Object.keys(selector)?.length) return null;
      return await Events.findOne(selector, options);
    },

    findEvents: async ({
      limit,
      offset,
      sort = {
        created: -1,
      },
      ...query
    }) => {
      return await Events.find(buildFindSelector(query as FindQuery), {
        skip: offset,
        limit,
        sort,
      }).fetch();
    },

    count: async (query) => {
      const count = await Events.rawCollection().countDocuments(
        buildFindSelector(query)
      );
      return count;
    },
    insert: async (doc) => {
      const eventValues = EventsSchema.clean(doc);
      eventValues.created = new Date();
      eventValues.createdBy = userId;
      EventsSchema.validate(eventValues);
      const eventId = await Events.insert(eventValues);
      return eventId;
    },
    update: async (eventId, doc) => {
      checkId(eventId);
      const eventValues = EventsSchema.clean(doc, { isModifier: true });
      eventValues.$set.updated = new Date();
      eventValues.$set.updatedBy = userId;

      EventsSchema.validate(eventValues, { modifier: true });
      await Events.update(eventId, eventValues);
    },
    remove: async (eventId) => {
      checkId(eventId);
      Events.remove(eventId);
    },
  };
};
