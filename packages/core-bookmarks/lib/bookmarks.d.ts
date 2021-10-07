import { BookmarksModule, EventsModule } from 'unchained-core-types';
export declare const configureBookmarks: ({ db, events }: {
    db: any;
    events: EventsModule;
}) => Promise<BookmarksModule>;
