import { assert } from 'chai';
import { configureEvents } from 'meteor/unchained:core-events';
import { db } from 'meteor/unchained:core-mongodb';
import { configureBookmarks } from 'meteor/unchained:core-bookmarks';

describe('Test exports', () => {
  it('Configure Bookmarks', async () => {
    const events = await configureEvents({ db });
    const module = await configureBookmarks({ db, events });

    assert.ok(module);
    assert.isFunction(module.findByUserIdAndProductId);
    assert.isFunction(module.existsByUserIdAndProductId);
  });
});
