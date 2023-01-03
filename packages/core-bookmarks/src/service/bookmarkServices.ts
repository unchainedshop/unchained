import { BookmarkServices } from '@unchainedshop/types/bookmarks.js';
import { migrateBookmarksService } from './migrateBookmarksService.js';

export const bookmarkServices: BookmarkServices = {
  migrateBookmarks: migrateBookmarksService,
};
