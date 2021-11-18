import { log } from 'unchained-logger';

const FilterError = {
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
};

class FilterAdapter {
  static key = '';

  static label = '';

  static version = '';

  constructor(context) {
    this.context = context;
  }

  // eslint-disable-next-line
  async searchProducts(productIds) {
    return productIds;
  }

  // eslint-disable-next-line
  async searchAssortments(assortmentIds) {
    return assortmentIds;
  }

  // This function is called to check if a filter actually matches a certain productId
  // eslint-disable-next-line
  aggregateProductIds(productIds) {
    return productIds;
  }

  // eslint-disable-next-line
  async transformSortStage(lastStage) {
    return lastStage;
  }

  // return a selector that is applied to Products.find to find relevant products
  // if no key is provided, it expects either null for all products or a list of products that are relevant
  // eslint-disable-next-line
  async transformProductSelector(lastSelector, { key, value }) {
    return lastSelector;
  }

  // return a selector that is applied to Filters.find to find relevant filters
  // eslint-disable-next-line
  async transformFilterSelector(lastSelector) {
    return lastSelector;
  }

  // eslint-disable-next-line
  log(message, { level = 'debug', ...options } = {}) {
    return log(message, { level, ...options });
  }
}

class FilterDirector {
  constructor(context) {
    this.context = context;
    this.adapterInstances =
      FilterDirector.sortedAdapters()
        ?.map((AdapterClass) => new AdapterClass(this.context))
        .filter(Boolean) || [];
  }

  async buildProductSelector(defaultSelector, options = {}) {
    return this.reduceAdapters(async (lastSelector, concreteAdapter) => {
      return concreteAdapter.transformProductSelector(
        await lastSelector,
        options
      );
    }, defaultSelector || null);
  }

  async buildSortStage(defaultStage, options = {}) {
    return this.reduceAdapters(async (lastStage, concreteAdapter) => {
      return concreteAdapter.transformSortStage(await lastStage, options);
    }, defaultStage || null);
  }

  async searchAssortments(assortmentIdResolver, options = {}) {
    return this.reduceAdapters(async (lastSearchPromise, concreteAdapter) => {
      return concreteAdapter.searchAssortments(
        await lastSearchPromise,
        options
      );
    }, assortmentIdResolver || null);
  }

  async searchProducts(productIdResolver, options = {}) {
    return this.reduceAdapters(async (lastSearchPromise, concreteAdapter) => {
      return concreteAdapter.searchProducts(await lastSearchPromise, options);
    }, productIdResolver || null);
  }

  aggregateProductIds(productIds) {
    const reducedProductIds = this.adapterInstances.reduce(
      (lastProductIds, concreteAdapter) =>
        concreteAdapter.aggregateProductIds(lastProductIds),
      productIds
    );
    return reducedProductIds;
  }

  async buildFilterSelector(defaultSelector, options = {}) {
    return this.reduceAdapters(async (lastSelector, concreteAdapter) => {
      return concreteAdapter.transformFilterSelector(
        await lastSelector,
        options
      );
    }, defaultSelector || null);
  }

  async reduceAdapters(reducer, initialValue) {
    if (this.adapterInstances.length === 0) {
      return null;
    }
    return this.adapterInstances.reduce(
      async (lastSearchPromise, concreteAdapter, index) => {
        return reducer(lastSearchPromise, concreteAdapter, index);
      },
      Promise.resolve(initialValue)
    );
  }

  static adapters = new Map();

  static sortedAdapters() {
    return Array.from(FilterDirector.adapters)
      .map((entry) => entry[1])
      .sort((left, right) => left.orderIndex - right.orderIndex);
  }

  static registerAdapter(adapter) {
    log(
      `${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
    );
    FilterDirector.adapters.set(adapter.key, adapter);
  }
}

export { FilterDirector, FilterAdapter, FilterError };
