import { Modules } from '../modules.js';

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
    countryContext: string;
  },
  { modules }: { modules: Modules },
) {
  const fromBookmarks = await modules.bookmarks.findBookmarks({ userId: fromUserId });
  if (!fromBookmarks) {
    // No bookmarks no copy needed
    return;
  }
  if (!shouldMerge) {
    await modules.bookmarks.deleteByUserId(toUserId);
    await modules.bookmarks.replaceUserId(fromUserId, toUserId);
  } else {
    const toBookmarks = await modules.bookmarks.findBookmarks({ userId: toUserId });
    const toBookmarkHashes = toBookmarks.map(hashBookmark);
    const newBookmarkIds = fromBookmarks
      .filter((fromBookmark) => {
        const hash = hashBookmark(fromBookmark);
        return !toBookmarkHashes.includes(hash);
      })
      .map((bookmark) => bookmark._id);
    await modules.bookmarks.replaceUserId(fromUserId, toUserId, newBookmarkIds);
  }
}
