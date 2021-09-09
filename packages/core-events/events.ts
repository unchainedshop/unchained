import { EventsModule } from 'unchained-core-types';
import { EventsCollection } from './db/EventsCollection';
import { configureEventDirector } from './director/configureEventDirector';
import { configureEventsModule } from './module/configureEventsModule';

const GLOBAL_EVENTS = ['PAGE_VIEW'];

export const configureEvents = ({ db }: { db: any }): EventsModule => {
  const Events = EventsCollection(db);
  const EventDirector = configureEventDirector(Events);

  const module = configureEventsModule(Events, EventDirector);

  module.registerEvents(GLOBAL_EVENTS);

  return module;
};
