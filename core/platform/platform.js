import startAPI from 'meteor/unchained:api';
import { interceptEmails } from 'meteor/unchained:core';

export * from './setup-db';
export * from './setup-accounts';
export * from './setup-cron';

export const startPlatform = (options = {}) => {
  startAPI(options);
  if (process.env.NODE_ENV !== 'production' && !options.disableEmailInterception) {
    interceptEmails();
  }
};
