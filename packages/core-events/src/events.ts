import { EventsModule } from 'unchained-core-types';
import { EventsCollection } from './db/EventsCollection';
import { configureEventsModule } from './module/configureEventsModule';

export { EventDirector, EventAdapter } from './director/EventDirector'

const GLOBAL_EVENTS = ['PAGE_VIEW'];

export const configureEvents = async ({ db }: { db: any }): Promise<EventsModule> => {
  const Events = await EventsCollection(db);
  const module = configureEventsModule(Events);

  module.registerEvents(GLOBAL_EVENTS);

  return module;
};
