import runMigrations from './db/schema';
import { Filters } from './db/collections';

export * from './db';
export * from './director';
export * from './search';

export default ({ skipInvalidationOnStartup = true } = {}) => {
  if (!skipInvalidationOnStartup) {
    Meteor.defer(() => {
      Filters.invalidateFilterCaches();
    });
  }
  runMigrations();
};
