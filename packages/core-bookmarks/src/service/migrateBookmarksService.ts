import { Modules } from '@unchainedshop/types';
import { Context } from '@unchainedshop/types/api';

export type MigrateBookmarksService = (
  params: {
    fromUserId: string;
    toUserId: string;
    mergeBookmarks: () => void;
  },
  context: Context
) => Promise<void>;

export const migrateBookmarksService: MigrateBookmarksService = async (
  { fromUserId, toUserId, mergeBookmarks },
  { modules, userId }
) => {
  const fromBookmarks = await modules.bookmarks.find({ userId: fromUserId });
  if (!fromBookmarks) {
    // No bookmarks no copy needed
    return;
  }
  if (!mergeBookmarks) {
    await modules.bookmarks.deleteByUserId(toUserId, userId);
  }
  await modules.bookmarks.replaceUserId(fromUserId, toUserId, userId);
};
