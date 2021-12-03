import { EventEmitter } from 'events';
import { EmitAdapter } from 'unchained-core-types/events';
import { setEmitAdapter } from 'meteor/unchained:events';

const NodeEventEmitter = (): EmitAdapter => {
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
setEmitAdapter(adapter);
