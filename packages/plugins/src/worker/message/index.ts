import { type IPlugin } from '@unchainedshop/core';
import { MessageWorker } from './adapter.ts';

// Plugin definition
export const MessagePlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.message',
  label: 'Message Worker Plugin',
  version: '1.0.0',

  adapters: [MessageWorker],
};

export default MessagePlugin;

// Re-export adapter for direct use
export * from './adapter.ts';
