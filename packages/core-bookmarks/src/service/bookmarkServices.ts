import { BookmarkServices } from '@unchainedshop/types/bookmarks';
import { migrateBookmarksService } from './migrateBookmarksService';

export const bookmarkServices: BookmarkServices = {
  migrateBookmarks: migrateBookmarksService,
};
