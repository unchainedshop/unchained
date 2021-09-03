import { registerEvents } from 'meteor/unchained:core-events';
import { UnchainedBookmarkAPI } from 'core/types';
import { configurBookmarksAPI } from './api/bookmarks.api';
import { configureBookmarksCollection } from './db/bookmarks.collection';

const BOOKMARK_EVENTS: string[] = ['BOOKMARK_CREATE', 'BOOKMARK_REMOVE'];

// eslint-disable-next-line
export const configureBookmarks =
  async (db: any): Promise<UnchainedBookmarkAPI> => {
    registerEvents(BOOKMARK_EVENTS);
    
    const collection = configureBookmarksCollection(db);
    const api = configurBookmarksAPI(collection);

    return api;
  };
