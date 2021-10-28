import { EventsModule } from 'unchained-core-types/types/events';
import { ModuleInput } from 'unchained-core-types/types/common';
import { configureEventsModule } from './module/configureEventsModule';

import { EventDirector, EventAdapter } from './director/EventDirector';

const GLOBAL_EVENTS = ['PAGE_VIEW'];

let emitEvent: EventsModule['emit'] = EventDirector.emit;
let { registerEvents } = EventDirector;

// Required to avoid meteor build errors (TypeError: module.runSetters is not a function)
const setEmitEvent = (emit: EventsModule['emit']): void => {
  emitEvent = emit;
};
const setRegisterEvents = (register: EventsModule['registerEvents']): void => {
  registerEvents = register;
};

const configureEvents = async ({ db }: ModuleInput): Promise<EventsModule> => {
  const module = await configureEventsModule({ db });

  module.registerEvents(GLOBAL_EVENTS);

  // setGlobalEventActions(module)

  return module;
};

export {
  configureEvents,
  emitEvent,
  registerEvents,
  EventDirector,
  EventAdapter,
};
