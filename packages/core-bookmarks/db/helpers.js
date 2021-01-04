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
  return Bookmarks.findBookmark({ bookmarkId });
};

Bookmarks.removeBookmark = ({ bookmarkId }) => {
  return Bookmarks.remove(bookmarkId);
};

Bookmarks.findBookmark = ({ bookmarkId }, options) =>
  Bookmarks.findOne({ _id: bookmarkId }, options);

Bookmarks.findBookmarks = ({ userId, productId } = {}) =>
  Bookmarks.find({
    ...(userId ? { userId } : {}),
    ...(productId ? { productId } : {}),
  }).fetch();

Bookmarks.migrateBookmarks = async ({
  fromUserId,
  toUserId,
  mergeBookmarks,
}) => {
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
