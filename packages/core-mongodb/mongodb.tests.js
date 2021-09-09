import { assert } from "chai"
import { db, Collection2 } from "meteor/unchained:core-mongodb"
import SimpleSchema from "simpl-schema"

describe('Test exports', () => {
  it('db', () => {
    assert.isDefined(db)
  })
  it('collection', () => {
    assert.isDefined(db.Collection);

    const TestCollection = new db.Collection('Test');

    assert.ok(TestCollection);
    assert.isFunction(TestCollection.find);

    TestCollection.attachSchema(new SimpleSchema({ name: String }));
    TestCollection.createIndex({ name: 1 }, { expireAfterSeconds: 120 })
  });
  it('Collection2', () => {
    assert.isDefined(Collection2);
  });
})