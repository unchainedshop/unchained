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
