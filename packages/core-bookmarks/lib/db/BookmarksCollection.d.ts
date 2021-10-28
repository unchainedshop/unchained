import { Db } from 'unchained-core-types';
import { Bookmark } from 'unchained-core-types/lib/bookmarks';
export declare const BookmarksCollection: (db: Db) => Promise<import("mongodb").Collection<Bookmark>>;
