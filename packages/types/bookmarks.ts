import type { Filter } from 'mongodb';
import { TimestampFields } from './common.js';
import { ModuleMutations, UnchainedCore } from './core.js';

import { User } from './user.js';

export type UserProductFilter = {
  userId: string;
  productId: string;
};

export type Bookmark = {
  _id?: string;
  userId: string;
  productId: string;
  meta?: any;
} & TimestampFields;

/*
 * Module
 */

export interface BookmarksModule extends ModuleMutations<Bookmark> {
  findBookmarksByUserId: (userId: string) => Promise<Array<Bookmark>>;
  findBookmarkById: (bookmarkId: string) => Promise<Bookmark>;
  findBookmarks: (query: Filter<Bookmark>) => Promise<Array<Bookmark>>;
  replaceUserId: (fromUserId: string, toUserId: string, bookmarkIds?: Array<string>) => Promise<number>;
  deleteByUserId: (toUserId: string) => Promise<number>;
  deleteByProductId: (productId: string) => Promise<number>;
  deleteByUserIdAndMeta: (meta: any) => Promise<number>;
}

/*
 * Services
 */

export type MigrateBookmarksService = (
  params: {
    fromUserId: string;
    toUserId: string;
    shouldMerge: boolean;
    countryContext: string;
  },
  unchainedAPI: UnchainedCore,
) => Promise<void>;

export interface BookmarkServices {
  migrateBookmarks: MigrateBookmarksService;
}
