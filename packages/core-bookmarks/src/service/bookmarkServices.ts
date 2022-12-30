import { BookmarkServices } from '@unchainedshop/types/bookmarks';
import { migrateBookmarksService } from './migrateBookmarksService.js';

export const bookmarkServices: BookmarkServices = {
  migrateBookmarks: migrateBookmarksService,
};
