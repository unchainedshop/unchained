import { EventEmitter } from 'node:events';
import { setEmitAdapter, type EmitAdapter } from '@unchainedshop/events';

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

setEmitAdapter(NodeEventEmitter());
