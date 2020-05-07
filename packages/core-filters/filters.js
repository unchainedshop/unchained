import './db/factories';
import './db/helpers';
import { Filters, FilterTexts } from './db/collections';

export * from './db/schema';
export * from './director';
export * from './search';

export { Filters, FilterTexts };

export default ({ skipInvalidationOnStartup = true } = {}) => {
  if (!skipInvalidationOnStartup) {
    Meteor.defer(() => {
      Filters.invalidateFilterCaches();
    });
  }
};
