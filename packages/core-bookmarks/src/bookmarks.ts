import { BookmarksModule, EventsModule } from 'unchained-core-types';
import { configureBookmarksModule } from './module/configureBookmarksModule';
import { BookmarksCollection } from './db/BookmarksCollection';

const BOOKMARK_EVENTS: string[] = ['BOOKMARK_CREATE', 'BOOKMARK_REMOVE'];

// eslint-disable-next-line
export const configureBookmarks = async ({ db, events }: { db: any, events: EventsModule }): Promise<BookmarksModule> => {
  events.registerEvents(BOOKMARK_EVENTS);

  const Bookmarks = await BookmarksCollection(db);
  const module = configureBookmarksModule(Bookmarks, events);

  return module;
};
