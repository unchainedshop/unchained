import { MigrateBookmarksService, migrateBookmarksService } from './migrateBookmarksService.js';

export interface BookmarkServices {
  migrateBookmarks: MigrateBookmarksService;
}

export const bookmarkServices: BookmarkServices = {
  migrateBookmarks: migrateBookmarksService,
};

export type { MigrateBookmarksService };
