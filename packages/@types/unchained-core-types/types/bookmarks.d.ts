import { Query, TimestampFields } from './common';

type UserProductFilter = {
  userId: string;
  productId: string;
};

export type Bookmark = {
  userId: string;
  productId: string;
} & TimestampFields;

export declare interface BookmarksModule {
  findByUserId: (userId: string) => Promise<Array<Bookmark>>;
  findByUserIdAndProductId: (filter: UserProductFilter) => Promise<Bookmark>;
  findById: (bookmarkId: string) => Promise<Bookmark>;
  find: (query: Query) => Promise<Array<Bookmark>>;
  replaceUserId: (fromUserId: string, toUserId: string) => Promise<number>;
  removeById: (bookmarkId: string) => Promise<number>;
  create: (data: Bookmark) => Promise<string>;
  existsByUserIdAndProductId: (filter: UserProductFilter) => Promise<boolean>;
}
