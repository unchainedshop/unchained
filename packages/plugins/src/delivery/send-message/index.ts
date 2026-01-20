import { type IPlugin } from '@unchainedshop/core';
import { SendMessage } from './adapter.ts';

// Plugin definition
export const SendMessagePlugin: IPlugin = {
  key: 'shop.unchained.delivery.send-message',
  label: 'Send Message Delivery Plugin',
  version: '1.0.0',

  adapters: [SendMessage],
};

export default SendMessagePlugin;

// Re-export adapter for direct use
export { SendMessage } from './adapter.ts';
