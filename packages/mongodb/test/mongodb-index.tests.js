import { assert } from "chai"
import { db, initDb } from "meteor/unchained:mongodb"
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
  it('initDb', () => {
    const rawDb = initDb()
    assert.isDefined(rawDb);

    const testCollection = rawDb.collection('test')
    assert.ok(testCollection)
  });
})