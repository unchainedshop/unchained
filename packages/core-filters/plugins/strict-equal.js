import { FilterDirector, FilterAdapter } from 'meteor/unchained:core-filters';

class StrictQualFilter extends FilterAdapter {
  static key = 'shop.unchained.filters.strict-qual';

  static label = 'Simple Strict Equal DB Filter';

  static version = '0.1';

  static orderIndex = 0;

  static isActivatedFor(context) { // eslint-disable-line
    return true;
  }

  async transformProductSelector(lastSelector, { key, value }) { // eslint-disable-line
    if (key) {
      return {
        ...lastSelector,
        [key]: value !== undefined ? value : { $exists: true }
      };
    }
    return lastSelector;
  }
}

FilterDirector.registerAdapter(StrictQualFilter);
