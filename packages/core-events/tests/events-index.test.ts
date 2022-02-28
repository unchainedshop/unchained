import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import { configureEventsModule } from 'meteor/unchained:events';
import { emit, registerEvents, getEmitHistoryAdapter } from 'meteor/unchained:events';

describe('Test exports', () => {
  let module;
  before(async () => {
    const db = await initDb();
    module = await configureEventsModule({ db });

    registerEvents(['TEST EVENT']);
  });
  it('Configure Events', () => {
    assert.isDefined(configureEventsModule);
    assert.ok(module);
    assert.isFunction(module.findEvent);
  });

  it('Test event history adapter', async () => {
    assert.ok(getEmitHistoryAdapter());

    emit('TEST EVENT', { orderId: 'Order1234' });

    const events = await module.findEvents({
      limit: 10,
      offset: 0,
      type: 'TEST EVENT',
    });

    assert.isAtLeast(events.length, 1)
  });
});
