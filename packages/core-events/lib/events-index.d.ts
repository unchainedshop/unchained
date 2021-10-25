import { EventsModule } from 'unchained-core-types/types/events';
import { ModuleInput } from 'unchained-core-types/types/common';
import { EventDirector, EventAdapter } from './director/EventDirector';
declare let emitEvent: EventsModule['emit'];
declare let registerEvents: EventsModule['registerEvents'];
declare const configureEvents: ({ db }: ModuleInput) => Promise<EventsModule>;
export { configureEvents, emitEvent, registerEvents, EventDirector, EventAdapter };
