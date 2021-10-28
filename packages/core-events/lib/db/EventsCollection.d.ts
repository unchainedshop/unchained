import { Db } from 'unchained-core-types';
import { Event } from 'unchained-core-types/lib/events';
export declare const EventsCollection: (db: Db) => Promise<import("mongodb").Collection<Event>>;
