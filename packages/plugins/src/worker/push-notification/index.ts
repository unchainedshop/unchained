import { type IPlugin } from '@unchainedshop/core';
import { PushNotificationWorkerPlugin as PushNotificationWorker } from './adapter.ts';

// Plugin definition
export const PushNotificationPlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.push-notification',
  label: 'Push Notification Worker Plugin',
  version: '1.0.0',

  adapters: [PushNotificationWorker],
};

export default PushNotificationPlugin;

// Re-export adapter for direct use
export { PushNotificationWorkerPlugin } from './adapter.ts';
