import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import { configureBookmarksModule } from 'meteor/unchained:core-bookmarks';
import { Mongo } from 'meteor/mongo';

describe('Test exports', () => {
  let module;

  before(async () => {
    const db = initDb();
    module = await configureBookmarksModule({ db });
  });

  it('Check Bookmarks module', async () => {
    assert.ok(module);
    assert.isFunction(module.findByUserIdAndProductId);
    assert.isFunction(module.existsByUserIdAndProductId);
    assert.isFunction(module.create);
    assert.isFunction(module.update);
    assert.isFunction(module.delete);
  });

  it('Mutate bookmark', async () => {
    const bookmarkId = await module.create(
      {
        userId: 'Test-User-1',
        productId: 'Product-22',
      },
      'Test-User-1'
    );

    assert.ok(bookmarkId);
    const bookmark = await module.findById(bookmarkId);

    assert.ok(bookmark);
    assert.equal(bookmark._id, bookmarkId);
    assert.equal(bookmark.userId, 'Test-User-1');
    assert.equal(bookmark.productId, 'Product-22');
    assert.isDefined(bookmark.created);
    assert.isUndefined(bookmark.updated);
    assert.isUndefined(bookmark.updatedBy);
    assert.equal(bookmark.createdBy, 'Test-User-1');

    const deletedCount = await module.removeById(bookmarkId);
    assert.equal(deletedCount, 1);
  });

  it('Check backwards compatibility', async () => {
    const Bookmarks = new Mongo.Collection<any>('bookmarks');

    const meteorBookmarkId = Bookmarks.insert({
      userId: 'Legacy-Test-User-1',
      productId: 'Legacy-Product-22',
      created: new Date(),
    });

    assert.ok(meteorBookmarkId);
    const bookmark = await module.findById(meteorBookmarkId);
    assert.ok(bookmark);
    assert.equal(bookmark._id, meteorBookmarkId);
    assert.equal(bookmark.userId, 'Legacy-Test-User-1');
    assert.equal(bookmark.productId, 'Legacy-Product-22');
    assert.isDefined(bookmark.created);
    assert.isUndefined(bookmark.updated);
    assert.isUndefined(bookmark.updatedBy);
    assert.isUndefined(bookmark.createdBy);

    const deletedCount = await module.delete(meteorBookmarkId);
    assert.equal(deletedCount, 1);
  });
});
