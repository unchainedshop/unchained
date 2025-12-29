export const SimpleBookmarks = [
  {
    _id: 'bookmark-1',
    userId: 'user',
    productId: 'simpleproduct',
    created: 1591885657906,
  },
  {
    _id: 'bookmark-2',
    userId: 'user',
    productId: 'plan-product',
    created: 1591885657906,
  },
  {
    _id: 'bookmark-3',
    userId: 'admin',
    productId: 'simpleproduct',
    created: 1591885657906,
  },
  {
    _id: 'bookmark-4',
    userId: 'admin',
    productId: 'plan-product',
    created: 1591885657906,
  },
];

export default async function seedBookmarks(db) {
  await db.collection('bookmarks').insertMany(SimpleBookmarks);
}

/**
 * Seed bookmarks into the Drizzle database.
 * This directly inserts into the database WITHOUT using the module to avoid emitting events.
 */
export async function seedBookmarksToDrizzle(db) {
  const { bookmarks } = await import('@unchainedshop/core-bookmarks');

  // Delete all existing bookmarks directly
  await db.delete(bookmarks);

  // Insert all bookmarks directly (bypassing module to avoid emitting events)
  for (const bookmark of SimpleBookmarks) {
    await db.insert(bookmarks).values({
      _id: bookmark._id,
      userId: bookmark.userId,
      productId: bookmark.productId,
      created: new Date(bookmark.created),
    });
  }
}
