import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import { configureEventHistoryModule } from 'meteor/unchained:core-eventhistory';

describe('Test exports', () => {
  it('Configure Events', async () => {
    const db = initDb()
    assert.isDefined(configureEventHistoryModule);
    const module = await configureEventHistoryModule({ db });
    assert.ok(module);
    assert.isFunction(module.findEvent);
  });
});
