import { describe, it } from 'node:test';
import assert from 'node:assert';
import { migrateBookmarksService } from './migrateBookmarks.ts';

const bookmarksModule = (bookmarksByUser: Record<string, { _id: string; productId: string }[]>) => {
  const deleted: string[] = [];
  return {
    deleted,
    bookmarks: {
      findBookmarks: async ({ userId }) => bookmarksByUser[userId] ?? [],
      deleteByUserId: async (userId: string) => {
        deleted.push(userId);
      },
      replaceUserId: async () => undefined,
    },
  };
};

describe('migrateBookmarksService', () => {
  it('keeps the bookmarks of the account when the guest has none', async () => {
    const modules = bookmarksModule({ account: [{ _id: 'bookmark', productId: 'product' }] });
    await migrateBookmarksService.bind(modules as any)({
      fromUserId: 'guest',
      toUserId: 'account',
      shouldMerge: false,
      countryCode: 'CH',
    });
    assert.deepStrictEqual(modules.deleted, []);
  });

  it('replaces the bookmarks of the account with the guest bookmarks when not merging', async () => {
    const modules = bookmarksModule({
      guest: [{ _id: 'guest-bookmark', productId: 'product' }],
      account: [{ _id: 'bookmark', productId: 'product' }],
    });
    await migrateBookmarksService.bind(modules as any)({
      fromUserId: 'guest',
      toUserId: 'account',
      shouldMerge: false,
      countryCode: 'CH',
    });
    assert.deepStrictEqual(modules.deleted, ['account']);
  });
});
