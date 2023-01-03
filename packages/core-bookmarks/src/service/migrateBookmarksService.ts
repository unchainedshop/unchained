import { MigrateBookmarksService } from '@unchainedshop/types/bookmarks.js';

export const migrateBookmarksService: MigrateBookmarksService = async (
  { fromUser, toUser, shouldMerge },
  { modules },
) => {
  const fromBookmarks = await modules.bookmarks.find({ userId: fromUser._id });
  if (!fromBookmarks) {
    // No bookmarks no copy needed
    return null;
  }
  if (!shouldMerge) {
    await modules.bookmarks.deleteByUserId(toUser._id);
  }
  await modules.bookmarks.replaceUserId(fromUser._id, toUser._id);

  return null;
};
