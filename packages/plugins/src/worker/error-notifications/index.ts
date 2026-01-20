import { type IPlugin } from '@unchainedshop/core';
import { ErrorNotifications, configureErrorNotificationsAutoscheduling } from './adapter.ts';

// Plugin definition
export const ErrorNotificationsPlugin: IPlugin = {
  key: 'shop.unchained.worker.error-notifications',
  label: 'Error Notifications Worker Plugin',
  version: '1.0.0',

  adapters: [ErrorNotifications],

  onRegister: () => {
    // Configure auto-scheduling for error notifications
    configureErrorNotificationsAutoscheduling();
  },
};

export default ErrorNotificationsPlugin;

// Re-export adapter for direct use
export * from './adapter.ts';
