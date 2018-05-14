import startAPI from 'meteor/unchained:api';

export * from './setup-db';
export * from './setup-accounts';
export * from './setup-cron';

export const startPlatform = (options) => {
  startAPI({
    ...options,
  });
};
