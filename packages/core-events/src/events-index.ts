import { EventsModule } from 'unchained-core-types/events';
import { ModuleInput } from 'unchained-core-types/common';
import { configureEventsModule } from './module/configureEventsModule';

import { EventDirector } from './director/EventDirector';

const GLOBAL_EVENTS = ['PAGE_VIEW'];

let { emit } = EventDirector;
let { registerEvents } = EventDirector;

// Required to avoid meteor build errors (TypeError: module.runSetters is not a function)
const setEmitEvent = (emitEvent: EventsModule['emit']): void => {
  emit = emitEvent;
};
const setRegisterEvents = (register: EventsModule['registerEvents']): void => {
  registerEvents = register;
};

const configureEvents = async ({ db }: ModuleInput): Promise<EventsModule> => {
  const module = await configureEventsModule({ db });

  module.registerEvents(GLOBAL_EVENTS);

  setRegisterEvents(module.registerEvents);
  setEmitEvent(module.emit);

  return module;
};

export { configureEvents, emit, registerEvents, EventDirector };
