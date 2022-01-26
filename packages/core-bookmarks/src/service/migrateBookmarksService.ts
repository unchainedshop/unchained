import { MigrateBookmarksService } from '@unchainedshop/types/bookmarks';

export const migrateBookmarksService: MigrateBookmarksService = async (
  { fromUserId, toUserId, shouldMergeBookmarks },
  { modules, userId },
) => {
  const fromBookmarks = await modules.bookmarks.find({ userId: fromUserId });
  if (!fromBookmarks) {
    // No bookmarks no copy needed
    return null;
  }
  if (!shouldMergeBookmarks) {
    await modules.bookmarks.deleteByUserId(toUserId, userId);
  }
  await modules.bookmarks.replaceUserId(fromUserId, toUserId, userId);
};
