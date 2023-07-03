import { MigrateBookmarksService } from '@unchainedshop/types/bookmarks.js';

const hashBookmark = (bookmark) => {
  return `${bookmark.productId}:${bookmark.userId}:${JSON.stringify(bookmark.meta || {})}`;
};

export const migrateBookmarksService: MigrateBookmarksService = async (
  { fromUser, toUser, shouldMerge },
  { modules },
) => {
  const fromBookmarks = await modules.bookmarks.findBookmarks({ userId: fromUser._id });
  if (!fromBookmarks) {
    // No bookmarks no copy needed
    return;
  }
  if (!shouldMerge) {
    await modules.bookmarks.deleteByUserId(toUser._id);
    await modules.bookmarks.replaceUserId(fromUser._id, toUser._id);
  } else {
    const toBookmarks = await modules.bookmarks.findBookmarks({ userId: toUser._id });
    const toBookmarkHashes = toBookmarks.map(hashBookmark);
    const newBookmarkIds = fromBookmarks
      .filter((fromBookmark) => {
        const hash = hashBookmark(fromBookmark);
        return !toBookmarkHashes.includes(hash);
      })
      .map((bookmark) => bookmark._id);
    await modules.bookmarks.replaceUserId(fromUser._id, toUser._id, newBookmarkIds);
  }
};
