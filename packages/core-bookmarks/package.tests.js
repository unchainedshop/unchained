import { assert } from 'chai';
import { Mongo } from 'meteor/mongo';
import { configureBookmarks } from 'meteor/unchained:core-bookmarks'

describe('Test exports', () => {
  it('db', () => {
    const api = configureBookmarks({ db: Mongo })
    console.log(api)
    assert.ok(api);
  });
});
