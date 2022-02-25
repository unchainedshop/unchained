import { assert } from "chai"
import { initDb } from "meteor/unchained:mongodb"

describe('Test exports', () => {
  it('initDb', () => {
    const db = await initDb()
    assert.isDefined(rawDb);

    const testCollection = db.collection('test')
    assert.ok(testCollection)
  });
})