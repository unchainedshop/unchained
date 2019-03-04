import { FilterDirector, FilterAdapter } from "meteor/unchained:core-filters";

class StrictQualFilter extends FilterAdapter {
  static key = "shop.unchained.filters.strict-qual";

  static label = "Simple Strict Equal DB Filter";

  static version = "0.1";

  static orderIndex = 0;

  static isActivatedFor(context) { // eslint-disable-line
    return true;
  }

  transformSelector({ selector, key, value }) { // eslint-disable-line
    return {
      ...selector,
      [key]: value !== undefined ? value : { $exists: true }
    };
  }
}

FilterDirector.registerAdapter(StrictQualFilter);
