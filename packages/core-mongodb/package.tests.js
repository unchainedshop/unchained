import { assert } from "chai"
import { Mongo } from 'meteor/mongo'
import { db, Collection2 } from "meteor/unchained:core-mongodb"

describe('Test exports', () => {
  it('mongo', () => {
    const TestCollection = Mongo.Collection('Test');

    assert.ok(TestCollection);
    assert.isFunction(TestCollection.find);
  })

  it('db', () => {
    assert.isDefined(db)

    const TestCollection = db.Collection('Test')

    assert.ok(TestCollection)
    assert.isFunction(TestCollection.find)
  })
  it('Collection2', () => {
    assert.isDefined(Collection2);
  });
})