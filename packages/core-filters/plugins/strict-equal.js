import { FilterDirector, FilterAdapter } from 'meteor/unchained:core-filters';

class StrictQualFilter extends FilterAdapter {
  static key = 'shop.unchained.filters.strict-qual';

  static label = 'Simple Strict Equal DB Filter';

  static version = '0.1';

  static orderIndex = 0;

  // eslint-disable-next-line
  async transformProductSelector(lastSelector, { key, value }) {
    if (key) {
      return {
        ...lastSelector,
        [key]: value !== undefined ? value : { $exists: true },
      };
    }
    return lastSelector;
  }
}

FilterDirector.registerAdapter(StrictQualFilter);
