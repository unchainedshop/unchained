import { EventsModule } from 'unchained-core-types';
export { EventDirector, EventAdapter } from './director/EventDirector';
export declare const configureEvents: ({ db }: {
    db: any;
}) => Promise<EventsModule>;
