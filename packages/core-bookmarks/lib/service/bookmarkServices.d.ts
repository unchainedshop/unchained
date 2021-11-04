import { MigrateBookmarksService } from './migrateBookmarksService';
export interface BookmarkServices {
    migrateBookmarks: MigrateBookmarksService;
}
export declare const bookmarkServices: BookmarkServices;
