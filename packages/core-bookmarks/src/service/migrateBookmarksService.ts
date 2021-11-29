import { Modules } from '@unchainedshop/types';

export type MigrateBookmarksService = (
  params: {
    fromUserId: string;
    toUserId: string;
    mergeBookmarks: () => void;
  },
  context: { modules: Modules }
) => Promise<void>;

export const migrateBookmarksService: MigrateBookmarksService = async (
  { fromUserId, toUserId, mergeBookmarks },
  { modules }
) => {
  const fromBookmarks = await modules.bookmarks.find({ userId: fromUserId });
  if (!fromBookmarks) {
    // No bookmarks no copy needed
    return;
  }
  if (!mergeBookmarks) {
    await modules.bookmarks.delete(toUserId);
  }
  await modules.bookmarks.replaceUserId(fromUserId, toUserId);
};
