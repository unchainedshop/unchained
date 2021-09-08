import { assert } from "chai"
import { db, Collection2 } from "meteor/unchained:core-mongodb"

describe('Test exports', () => {
  it('db', () => {
    assert.isDefined(db)
  })
  it('Collection2', () => {
    assert.isDefined(Collection2);
  });
})