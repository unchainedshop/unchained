import { assert } from 'chai';
import { db } from 'meteor/unchained:core-mongodb';
import { configureBookmarks } from 'meteor/unchained:core-bookmarks'
import { configureEvents } from 'meteor/unchained:core-events'

describe('Test exports', () => {
  it('db', () => {
    const events = configureEvents({ db })
    const module = configureBookmarks({ db, events })

    assert.ok(module);
    assert.isFunction(module.findByUserIdAndProductId)
    assert.isFunction(module.existsByUserIdAndProductId);
  });
});
