import { EventsModule, EventAdapter } from 'unchained-core-types/events';
import { ModuleInput } from 'unchained-core-types/common';
import { EventDirector } from './director/EventDirector';
declare let emitEvent: EventsModule['emit'];
declare let registerEvents: (events: string[]) => void;
declare const configureEvents: ({ db }: ModuleInput) => Promise<EventsModule>;
export { configureEvents, emitEvent, registerEvents, EventDirector, EventAdapter, };
