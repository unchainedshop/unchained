/**
 * Node.js Event Emitter Adapter
 *
 * NOTE: This file uses a different pattern than the plugin architecture.
 * Events adapters implement EmitAdapter interface and are registered via
 * setEmitAdapter() instead of the standard IPlugin pattern.
 *
 * Usage:
 *   import { setEmitAdapter } from '@unchainedshop/events';
 *   import { NodeEventEmitter } from '@unchainedshop/plugins/events/node-event-emitter';
 *   setEmitAdapter(NodeEventEmitter());
 */
import { EventEmitter } from 'node:events';
import { type EmitAdapter } from '@unchainedshop/events';

export const NodeEventEmitter = (): EmitAdapter => {
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

export default NodeEventEmitter;
