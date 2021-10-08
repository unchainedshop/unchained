import { assert } from 'chai';
import { db } from 'meteor/unchained:core-mongodb';
import { configureEvents, EventDirector } from 'meteor/unchained:core-events';
import '../plugins/node-event-emitter';
// import '../plugins/matomo-tracker';

describe('Test exports', () => {
  it('Configure Events', async () => {
    assert.isDefined(configureEvents);
    const module = await configureEvents({ db });
    assert.ok(module);
    assert.isFunction(module.registerEvents);
  });

  it('Check Adapter', () => {
    assert.isDefined(EventDirector.getEventAdapter());
  });
});
