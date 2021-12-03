import {
  migrateBookmarksService,
  MigrateBookmarksService,
} from './migrateBookmarksService';

export interface BookmarkServices {
  migrateBookmarks: MigrateBookmarksService;
}

export const bookmarkServices: BookmarkServices = {
  migrateBookmarks: migrateBookmarksService,
};
