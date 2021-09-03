import { migrateBookmarks, MigrateBookmarks } from "./services/service.migrateBookmarks";

export interface BookmarkServices {
  migrateBookmarks: MigrateBookmarks
};

export const bookmarkServices: BookmarkServices = {
  migrateBookmarks,
};
