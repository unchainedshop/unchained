import { registerEvents } from 'meteor/unchained:core-events';
import runMigrations from './db/schema';
import { Filters } from './db/collections';

export * from './db';
export * from './director';
export * from './search';

export default ({ skipInvalidationOnStartup = true } = {}) => {
  if (!skipInvalidationOnStartup) {
    Meteor.defer(() => {
      Filters.invalidateCache();
    });
  }
  runMigrations();
  registerEvents(['FILTER_CREATE', 'FILTER_UPDATE', 'FILTER_REMOVE']);
};
