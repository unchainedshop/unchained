import { Collection } from 'unchained-core-types';
import { Event, EventDirector as EventDirectorType } from 'unchained-core-types/lib/events';
export declare type ContextNormalizerFunction = (context: any) => any;
export declare const defaultNormalizer: ContextNormalizerFunction;
export interface EventAdapter {
    publish(eventName: string, payload: any): void;
    subscribe(eventName: string, callBack: (payload?: any) => void): void;
}
export declare const EventDirector: EventDirectorType & {
    getEventAdapter: () => EventAdapter;
};
export declare const emit: (eventName: string, data: any) => Promise<void>, getRegisteredEvents: () => string[], registerEvents: (events: string[]) => void, setContextNormalizer: (fn: import("unchained-core-types/lib/events").ContextNormalizerFunction) => void, setEventAdapter: (adapter: import("unchained-core-types/lib/events").EventAdapter) => void, subscribe: (eventName: string, callBack: () => void) => void;
export declare const configureEventDirector: (Events: Collection<Event>) => EventDirectorType;
