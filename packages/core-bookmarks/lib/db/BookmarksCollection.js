import { BookmarkSchema } from './BookmarksSchema';
export var BookmarksCollection = function (db) {
    var Bookmarks = new db.Collection('bookmarks');
    Bookmarks.attachSchema(BookmarkSchema);
    Bookmarks.createIndex({ userId: 1 });
    Bookmarks.createIndex({ productId: 1 });
    return Bookmarks;
};
//# sourceMappingURL=BookmarksCollection.js.map