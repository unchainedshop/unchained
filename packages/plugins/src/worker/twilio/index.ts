import { type IPlugin } from '@unchainedshop/core';
import { SmsWorkerPlugin as TwilioWorker } from './adapter.ts';

// Plugin definition
export const TwilioPlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.twilio',
  label: 'Twilio SMS Worker Plugin',
  version: '1.0.0',

  adapters: [TwilioWorker],
};

export default TwilioPlugin;

// Re-export adapter for direct use
export { SmsWorkerPlugin } from './adapter.ts';
