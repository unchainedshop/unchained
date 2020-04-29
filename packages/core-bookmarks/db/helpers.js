import 'meteor/dburles:collection-helpers';
import { Users } from 'meteor/unchained:core-users';
import { Products } from 'meteor/unchained:core-products';
import { Bookmarks } from './collections';

Bookmarks.helpers({
  product() {
    return Products.findOne({ _id: this.productId });
  },
  user() {
    return Users.findOne({ _id: this.userId });
  },
});

Bookmarks.createBookmark = ({ userId, productId, ...rest }) => {
  const bookmarkId = Bookmarks.insert({
    ...rest,
    created: new Date(),
    userId,
    productId,
  });
  return Bookmarks.findBookmarkById(bookmarkId);
};

Bookmarks.removeBookmark = ({ _id }) => {
  const bookmark = Bookmarks.findBookmarkById(_id);
  Bookmarks.remove({ _id });
  return bookmark;
};

Bookmarks.findBookmarkById = (_id) => Bookmarks.findOne({ _id });

Bookmarks.findBookmarks = ({ userId, productId } = {}) =>
  Bookmarks.find({
    ...(userId ? { userId } : {}),
    ...(productId ? { productId } : {}),
  }).fetch();

Bookmarks.migrateBookmarks = ({ fromUserId, toUserId, mergeBookmarks }) => {
  const fromBookmarks = Users.findOne({ _id: fromUserId }).bookmarks();

  if (!fromBookmarks) {
    // No bookmarks no copy needed
    return;
  }

  if (!mergeBookmarks) {
    Bookmarks.remove({ toUserId });
  }

  Bookmarks.update(
    { userId: fromUserId },
    {
      $set: {
        userId: toUserId,
      },
    },
    {
      multi: true,
    }
  );
};

Users.helpers({
  bookmarks() {
    return Bookmarks.findBookmarks({ userId: this._id });
  },
});
