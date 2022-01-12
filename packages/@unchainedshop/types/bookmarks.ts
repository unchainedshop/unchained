import { Context } from './api';
import { ModuleMutations, Query, TimestampFields, _ID } from './common';
import { User } from './user';

type UserProductFilter = {
  userId: string;
  productId: string;
};

export type Bookmark = {
  _id?: _ID;
  userId: string;
  productId: string;
} & TimestampFields;

/*
 * Module
 */

export interface BookmarksModule extends ModuleMutations<Bookmark> {
  findByUserId: (userId: string) => Promise<Array<Bookmark>>;
  findByUserIdAndProductId: (filter: UserProductFilter) => Promise<Bookmark>;
  findById: (bookmarkId: string) => Promise<Bookmark>;
  find: (query: Query) => Promise<Array<Bookmark>>;
  existsByUserIdAndProductId: (filter: UserProductFilter) => Promise<boolean>;
  replaceUserId: (
    fromUserId: string,
    toUserId: string,
    userId: string
  ) => Promise<number>;
  deleteByUserId: (toUserId: string, userId: string) => Promise<number>;
}

/*
 * Services
 */

export type MigrateBookmarksService = (
  params: {
    fromUserId: string;
    toUserId: string;
    shouldMergeBookmarks: () => void;
  },
  context: Context
) => Promise<void>;

export interface BookmarkServices {
  migrateBookmarks: MigrateBookmarksService;
}
