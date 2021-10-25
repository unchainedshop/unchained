import { EventsModule } from 'unchained-core-types/types/events';
import { ModuleInput } from 'unchained-core-types/types/common';
import { configureEventsModule } from './module/configureEventsModule';

import { EventDirector, EventAdapter } from './director/EventDirector'

const GLOBAL_EVENTS = ['PAGE_VIEW'];

let emitEvent: EventsModule['emit'] = EventDirector.emit
let registerEvents: EventsModule['registerEvents'] = EventDirector.registerEvents

const configureEvents = async ({ db }: ModuleInput): Promise<EventsModule> => {
  const module = await configureEventsModule({ db });

  module.registerEvents(GLOBAL_EVENTS);

  emitEvent = module.emit
  registerEvents = module.registerEvents

  return module;
};

export { configureEvents, emitEvent, registerEvents, EventDirector, EventAdapter } 