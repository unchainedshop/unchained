import { assert } from 'chai';
import { initDb } from 'meteor/unchained:core-mongodb';
import { configureEvents, registerEvents, emit, EventDirector } from 'meteor/unchained:core-events';
import '../plugins/node-event-emitter';
// import '../plugins/matomo-tracker';

describe('Test exports', () => {
  it('Configure Events', async () => {
    const db = initDb()
    assert.isDefined(configureEvents);
    const module = await configureEvents({ db });
    assert.ok(module);
    assert.isFunction(module.registerEvents);
  });

  it('Check Adapter', () => {
    assert.isDefined(EventDirector.getEventAdapter());
  })

  it('Check global event actions', () => {
    assert.isFunction(registerEvents)
    assert.isFunction(emit)
    
    registerEvents(['TEST_EVENT', 'TEST_EVENT_2'])
    emit('TEST_EVENT')
  });
});
