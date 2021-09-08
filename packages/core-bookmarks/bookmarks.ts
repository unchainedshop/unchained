import { registerEvents } from 'meteor/unchained:core-events';
import { BookmarksModule } from 'unchained-core';
import { configureBookmarksModule } from './api/bookmarks.api';
import { configureBookmarksCollection } from './db/bookmarks.collection';

const BOOKMARK_EVENTS: string[] = ['BOOKMARK_CREATE', 'BOOKMARK_REMOVE'];

// eslint-disable-next-line
export const configureBookmarks = async ({ db }: { db: any }): Promise<BookmarksModule> => {
  registerEvents(BOOKMARK_EVENTS);

  const collection = configureBookmarksCollection(db);
  const module = configureBookmarksModule(collection);

  return module;
};
