import { Filters } from './db/collections';

export * from './db';
export * from './director';

export default ({ skipInvalidationOnStartup = false }) => {
  // configure
  if (!skipInvalidationOnStartup) {
    Meteor.defer(() => {
      Filters.invalidateFilterCaches();
    });
  }
};
