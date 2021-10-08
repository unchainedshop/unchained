import { EventsModule } from 'unchained-core-types';
export { EventAdapter, setEventAdapter } from './director/EventAdapter';
export declare const configureEvents: ({ db }: {
    db: any;
}) => Promise<EventsModule>;
