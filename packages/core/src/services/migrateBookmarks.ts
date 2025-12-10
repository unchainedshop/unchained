import type { Modules } from '../modules.ts';

const hashBookmark = (bookmark) => {
  return `${bookmark.productId}:${bookmark.userId}:${JSON.stringify(bookmark.meta || {})}`;
};

export async function migrateBookmarksService(
  this: Modules,
  {
    fromUserId,
    toUserId,
    shouldMerge,
  }: {
    fromUserId: string;
    toUserId: string;
    shouldMerge: boolean;
    countryCode: string;
  },
) {
  const fromBookmarks = await this.bookmarks.findBookmarks({ userId: fromUserId });
  if (!fromBookmarks) {
    // No bookmarks no copy needed
    return;
  }
  if (!shouldMerge) {
    await this.bookmarks.deleteByUserId(toUserId);
    await this.bookmarks.replaceUserId(fromUserId, toUserId);
  } else {
    const toBookmarks = await this.bookmarks.findBookmarks({ userId: toUserId });
    const toBookmarkHashes = toBookmarks.map(hashBookmark);
    const newBookmarkIds = fromBookmarks
      .filter((fromBookmark) => {
        const hash = hashBookmark(fromBookmark);
        return !toBookmarkHashes.includes(hash);
      })
      .map((bookmark) => bookmark._id);
    await this.bookmarks.replaceUserId(fromUserId, toUserId, newBookmarkIds);
  }
}
