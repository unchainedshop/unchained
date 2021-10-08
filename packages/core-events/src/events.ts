import { EventsModule } from 'unchained-core-types';
import { EventsCollection } from './db/EventsCollection';
import { configureEventDirector } from './director/configureEventDirector';
import { configureEventsModule } from './module/configureEventsModule';
export { EventAdapter, setEventAdapter } from './director/EventAdapter'

const GLOBAL_EVENTS = ['PAGE_VIEW'];

export const configureEvents = async ({ db }: { db: any }): Promise<EventsModule> => {
  const Events = await EventsCollection(db);
  const EventDirector = configureEventDirector(Events);

  const module = configureEventsModule(Events, EventDirector);

  module.registerEvents(GLOBAL_EVENTS);

  return module;
};
