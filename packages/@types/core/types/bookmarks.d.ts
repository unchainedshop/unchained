type UserProductFilter = {
  userId: string;
  productId: string;
};
export type Bookmark = {
  userId: string;
  productId: string;
};

export interface BookmarkAPI {
  findByUserId: (userId: string) => Promise<Array<Bookmark>>;
  findByUserIdAndProductId: ({
    userId,
    productId,
  }: UserProductFilter) => Promise<Bookmark>;
  findById: (bookmarkId: string) => Promise<Bookmark>;
  find: (query: any) => Promise<Array<Bookmark>>;
  replaceUserId: (fromUserId: string, toUserId: string) => Promise<number>;
  removeById: (bookmarkId: string) => Promise<number>;
  create: (data: Bookmark) => Promise<string>;
  existsByUserIdAndProductId: ({
    userId,
    productId,
  }: UserProductFilter) => Promise<boolean>;
}
