import { EventEmitter } from 'events';
// import { setEventAdapter, EventAdapter } from 'unchained-core-events';
import { setEventAdapter, EventAdapter } from '../src/events';

const NodeEventEmitter = (): EventAdapter => {
  const eventEmitter = new EventEmitter();

  return {
    publish: (eventName, payload) => {
      eventEmitter.emit(eventName, payload);
    },

    subscribe: (eventName, callback) => {
      return eventEmitter.on(eventName, callback);
    },
  };
};

setEventAdapter(NodeEventEmitter());
