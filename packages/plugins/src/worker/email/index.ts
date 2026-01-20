import { type IPlugin } from '@unchainedshop/core';
import { EmailWorkerPlugin as EmailWorker } from './adapter.ts';

// Plugin definition
export const EmailPlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.email',
  label: 'Email Worker Plugin',
  version: '1.0.0',

  adapters: [EmailWorker],
};

export default EmailPlugin;

// Re-export adapter for direct use
export { EmailWorkerPlugin, checkEmailInterceptionEnabled } from './adapter.ts';
