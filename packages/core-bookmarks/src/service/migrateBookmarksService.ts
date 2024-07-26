import { UnchainedCore } from '@unchainedshop/types/core.js';

export type MigrateBookmarksService = (
  params: {
    fromUserId: string;
    toUserId: string;
    shouldMerge: boolean;
    countryContext: string;
  },
  unchainedAPI: UnchainedCore,
) => Promise<void>;

const hashBookmark = (bookmark) => {
  return `${bookmark.productId}:${bookmark.userId}:${JSON.stringify(bookmark.meta || {})}`;
};

export const migrateBookmarksService: MigrateBookmarksService = async (
  { fromUserId, toUserId, shouldMerge },
  { modules },
) => {
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
};
