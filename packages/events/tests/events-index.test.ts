import { assert } from 'chai';
import {
  emit,
  getEmitAdapter,
  getEmitHistoryAdapter,
  registerEvents,
  setEmitAdapter,
  setEmitHistoryAdapter,
} from '../src/events-index';
import { EmitAdapter } from '../src/events.types';
import { log } from 'unchained-logger';

const subscribedEvents = new Set();

const TestEventEmitter: EmitAdapter = {
  publish: (eventName, payload) => log(eventName),
  subscribe: (eventName, callback) => {
    if (!subscribedEvents.has(eventName)) {
      log(`Subscribe event: ${eventName}`);
      subscribedEvents.add(eventName);
    }
  },
};

describe('Test exports', () => {
  it('Check set Adapter', () => {
    assert.isUndefined(getEmitAdapter());
    assert.isFunction(setEmitAdapter);
    assert.isFunction(getEmitHistoryAdapter);
    assert.isFunction(setEmitHistoryAdapter);

    setEmitAdapter(TestEventEmitter);
  });

  it('Check emit global page event', () => {
    assert.isFunction(emit);

    emit('PAGE_VIEW');
  });

  it('Check emit event', () => {
    assert.isFunction(registerEvents);

    registerEvents(['TEST_EVENT', 'TEST_EVENT_2']);
    emit('TEST_EVENT');
  });

  it('Check emit non-existing event', (done) => {
    emit('I_AM_NOT_REGISTERED_EVENT').then(() => {
      assert(false, 'Non-existing event should not be emittable')
      done()
    }).catch(error => {
      assert.equal(error.message, 'Event with I_AM_NOT_REGISTERED_EVENT is not registered')
      done()
    });
  });
});
