import { log } from 'meteor/unchained:core-logger';

const FilterError = {
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
};

class FilterAdapter {
  static key = ''

  static label = ''

  static version = ''

  static isActivatedFor(context) { // eslint-disable-line
    return false;
  }

  constructor(context) {
    this.context = context;
  }

  transformSelector({ last }) { // eslint-disable-line
    return last;
  }

  log(message) { // eslint-disable-line
    return log(message);
  }
}

class FilterDirector {
  constructor(context) {
    this.context = context;
  }

  buildProductSelector({ key, value }) {
    return FilterDirector.sortedAdapters()
      .filter((AdapterClass => AdapterClass.isActivatedFor(this.context)))
      .reduce((lastSelector, AdapterClass) => {
        const concreteAdapter = new AdapterClass({
          context: this.context,
        });
        return concreteAdapter.transformSelector({
          last: lastSelector,
          key,
          value,
        });
      }, {});
  }

  static adapters = new Map();

  static sortedAdapters() {
    return Array.from(FilterDirector.adapters)
      .map(entry => entry[1])
      .sort((left, right) => left.orderIndex > right.orderIndex);
  }

  static registerAdapter(adapter) {
    log(`${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`) // eslint-disable-line
    FilterDirector.adapters.set(adapter.key, adapter);
  }
}

export {
  FilterDirector,
  FilterAdapter,
  FilterError,
};
