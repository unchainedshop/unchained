import { assert } from 'chai';
import {
  registerEvents,
  emit,
  setEmitAdapter,
  getEmitAdapter,
  setEmitHistoryAdapter,
} from '../src/events-index';
import { EmitAdapter } from '../src/events';
// import { log } from 'unchained-logger';

const subscribedEvents = new Set();

const TestEventEmitter: EmitAdapter = {
  publish: (eventName, payload) => console.log(eventName),
  subscribe: (eventName, callback) => {
    if (!subscribedEvents.has(eventName)) {
      console.log(`Subscribe event: ${eventName}`);
      subscribedEvents.add(eventName);
    }
  },
};

describe('Test exports', () => {
  it('Check set Adapter', () => {
    assert.isUndefined(getEmitAdapter());

    setEmitAdapter(TestEventEmitter);
  });

  it('Check emit event', () => {
    assert.isFunction(registerEvents);
    assert.isFunction(emit);

    registerEvents(['TEST_EVENT', 'TEST_EVENT_2']);
    emit('TEST_EVENT');
  });
});
