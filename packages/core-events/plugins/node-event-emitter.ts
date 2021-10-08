import { EventEmitter } from 'events';
// import { EventDirector, EventAdapter } from 'unchained-core-events';
import { EventDirector, EventAdapter } from 'meteor/unchained:core-events';

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

const adapter = NodeEventEmitter();
EventDirector.setEventAdapter(adapter);
