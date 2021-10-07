import { BookmarkSchema } from './BookmarksSchema';
export var BookmarksCollection = function (db) {
    console.log('DB', db);
    var Bookmarks = new db.Collection('bookmarks');
    console.log('BOOKMARKS', Bookmarks);
    Bookmarks.attachSchema(BookmarkSchema);
    Bookmarks.createIndex({ userId: 1 });
    Bookmarks.createIndex({ productId: 1 });
    return Bookmarks;
};
//# sourceMappingURL=BookmarksCollection.js.map