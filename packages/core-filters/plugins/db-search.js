import { FilterDirector, FilterAdapter } from 'meteor/unchained:core-filters';

class DBSearchFilter extends FilterAdapter {
  static key = 'shop.unchained.filters.db-search';

  static label = 'Simple Fulltext search with MongoDB';

  static version = '0.1';

  static orderIndex = 0;

  static isActivatedFor(context) { // eslint-disable-line
    return true;
  }

  async productIds({ searchQuery }) {
    return [];
  }
}

FilterDirector.registerAdapter(DBSearchFilter);
