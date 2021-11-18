import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import { configureEventsModule } from 'meteor/unchained:core-events';

describe('Test exports', () => {
  it('Configure Events', async () => {
    const db = initDb()
    assert.isDefined(configureEventsModule);
    const module = await configureEventsModule({ db });
    assert.ok(module);
    assert.isFunction(module.findEvent);
  });
});
