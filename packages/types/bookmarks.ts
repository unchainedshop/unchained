import { Query, TimestampFields, _ID } from './common';
import { ModuleMutations, UnchainedCore } from './core';

import { User } from './user';

export type UserProductFilter = {
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
  replaceUserId: (fromUserId: string, toUserId: string) => Promise<number>;
  deleteByUserId: (toUserId: string) => Promise<number>;
  deleteByProductId: (productId: string) => Promise<number>;
}

/*
 * Services
 */

export type MigrateBookmarksService = (
  params: {
    fromUser: User;
    toUser: User;
    shouldMerge: boolean;
    countryContext: string;
  },
  unchainedAPI: UnchainedCore,
) => Promise<void>;

export interface BookmarkServices {
  migrateBookmarks: MigrateBookmarksService;
}
