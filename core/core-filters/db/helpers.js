import 'meteor/dburles:collection-helpers';
import { Products } from 'meteor/unchained:core-products';
import { Filters } from './collections';
import { FilterDirector } from '../director';

const parseQueryArray = query => (query || [])
  .reduce((accumulator, { key, value }) => ({
    ...accumulator,
    [key]: accumulator[key] ? accumulator[key].concat(value) : [value],
  }), {});

Filters.helpers({
  collectProductIds({ value } = {}) {
    const director = new FilterDirector({ filter: this });
    const selector = director.buildProductSelector({ key: this.key, value });
    const products = Products.find(selector, { fields: { _id: true } }).fetch();
    return products.map(({ _id }) => _id);
  },
  buildProductIdMap() {
    const cache = {
      allProductIds: this.collectProductIds(),
    };
    cache.productIds = this.options.reduce((accumulator, option) => ({
      ...accumulator,
      [option]: this.collectProductIds({ value: option }),
    }), {});
    return cache;
  },
  invalidateProductIdCache() {
    Filters.update({ _id: this._id }, {
      $set: {
        _cache: this.buildProductIdMap(),
      },
    });
  },
  productIds({ values, forceLiveCollection }) {
    const { productIds, allProductIds } = forceLiveCollection
      ? this.buildProductIdMap()
      : (this._cache || this.buildProductIdMap()); // eslint-disable-line

    return values.reduce((accumulator, value) => {
      const additionalValues = value === undefined ? allProductIds : productIds[value];
      if (!additionalValues || additionalValues.length === 0) return accumulator;
      return [...accumulator, ...additionalValues];
    }, []);
  },
  intersect({ values, forceLiveCollection, productIdSet }) {
    const filterOptionProductIds = this.productIds({ values, forceLiveCollection });
    return new Set(filterOptionProductIds.filter(x => productIdSet.has(x)));
  },
  filteredOptions({ values, forceLiveCollection, productIdSet }) {
    return this.options.map(value => ({
      option: {
        value,
      },
      remaining: this.intersect({ values: [value], forceLiveCollection, productIdSet }).size,
      active: values ? (values.indexOf(value) !== -1) : false,
    }));
  },
});

Filters.filterProductIds = ({ productIds, query, forceLiveCollection = false }) => {
  if (!query || query.length === 0) return productIds;
  const queryObject = parseQueryArray(query);

  const filters = Filters
    .find({ key: { $in: Object.keys(queryObject) } })
    .fetch();

  const intersectedProductIds = filters
    .reduce((productIdSet, filter) => {
      const values = queryObject[filter.key];
      return filter.intersect({ values, forceLiveCollection, productIdSet });
    }, new Set(productIds));

  return [...intersectedProductIds];
};

Filters.filterFilters = ({
  filterIds, productIds, query, forceLiveCollection = false,
}) => {
  const queryObject = parseQueryArray(query);

  return Filters
    .find({ _id: { $in: filterIds } })
    .fetch()
    .map((filter) => {
      const values = queryObject[filter.key];
      const productIdSet = new Set(productIds);
      const remainingProductIdSet = values
        ? filter.intersect({ values, forceLiveCollection, productIdSet })
        : productIdSet;
      return {
        filter,
        remaining: remainingProductIdSet.size,
        active: Object.keys(queryObject).indexOf(filter.key) !== -1,
        filteredOptions: filter.filteredOptions({
          values,
          forceLiveCollection,
          productIdSet: remainingProductIdSet,
        }),
      };
    });
};
