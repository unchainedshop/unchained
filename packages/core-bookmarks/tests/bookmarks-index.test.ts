import { assert } from 'chai';
import { initDb } from '@unchainedshop/mongodb';
import { configureBookmarksModule } from '@unchainedshop/core-bookmarks';

describe('Test exports', () => {
  let module;

  before(async () => {
    const db = await initDb();
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

    const deletedCount = await module.delete(bookmarkId);
    assert.equal(deletedCount, 1);
  });
});
