import { Collection } from 'unchained-core-types';
import { Event, EventAdapter, EventDirector as EventDirectorType } from 'unchained-core-types/events';
export declare type ContextNormalizerFunction = (context: any) => any;
export declare const defaultNormalizer: ContextNormalizerFunction;
export declare const EventDirector: EventDirectorType & {
    getEventAdapter: () => EventAdapter;
};
export declare const emit: (eventName: string, data: any) => Promise<void>, getRegisteredEvents: () => string[], registerEvents: (events: string[]) => void, setContextNormalizer: (fn: import("unchained-core-types/events").ContextNormalizerFunction) => void, setEventAdapter: (adapter: EventAdapter) => void, subscribe: (eventName: string, callBack: () => void) => void;
export declare const configureEventDirector: (Events: Collection<Event>) => EventDirectorType;
