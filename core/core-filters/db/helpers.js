import 'meteor/dburles:collection-helpers';
import { Meteor } from 'meteor/meteor';
import { Locale } from 'locale';
import { findLocalizedText } from 'meteor/unchained:core';
import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { FilterTypes } from './schema';
import { Filters, FilterTexts } from './collections';
import { FilterDirector } from '../director';

const parseQueryArray = query => (query || [])
  .reduce((accumulator, { key, value }) => ({
    ...accumulator,
    [key]: accumulator[key] ? accumulator[key].concat(value) : [value],
  }), {});

Filters.createFilter = ({
  locale, title, type, key, options, ...rest
}) => {
  const filter = {
    created: new Date(),
    type: FilterTypes[type],
    key,
    options,
    ...rest,
  };
  const filterId = Filters.insert(filter);
  const filterObject = Filters.findOne({ _id: filterId });
  filterObject.upsertLocalizedText({ locale, title });
  return filterObject;
};

Filters.getLocalizedTexts = (
  filterId,
  filterOptionValue,
  locale,
) => findLocalizedText(FilterTexts, {
  filterId,
  filterOptionValue,
}, locale);

Filters.sync = (syncFn) => {
  const referenceDate = Filters.markFiltersDirty();
  syncFn(referenceDate);
  Filters.cleanFiltersByReferenceDate(referenceDate);
  Filters.updateCleanFilterActivation();
  Filters.wipeFilters();
};

Filters.markFiltersDirty = () => {
  const dirtyModifier = { $set: { dirty: true } };
  const collectionUpdateOptions = { bypassCollection2: true, multi: true };
  const updatedFiltersCount = Filters.update(
    {}, dirtyModifier, collectionUpdateOptions,
  );
  const updatedFilterTextsCount = FilterTexts.update(
    {}, dirtyModifier, collectionUpdateOptions,
  );
  const timestamp = new Date();
  console.log(`Filter Sync: Marked Filters dirty at timestamp ${timestamp}`, { // eslint-disable-line
    updatedFiltersCount,
    updatedFilterTextsCount,
  });
  return new Date();
};

Filters.cleanFiltersByReferenceDate = (referenceDate) => {
  const selector = {
    dirty: true,
    $or: [{
      updated: { $gte: referenceDate },
    }, {
      created: { $gte: referenceDate },
    }],
  };
  const modifier = { $set: { dirty: false } };
  const collectionUpdateOptions = { bypassCollection2: true, multi: true };
  const updatedFiltersCount = Filters.update(
    selector, modifier, collectionUpdateOptions,
  );
  const updatedFilterTextsCount = FilterTexts.update(
    selector, modifier, collectionUpdateOptions,
  );
  console.log(`Filter Sync: Result of filter cleaning with referenceDate=${referenceDate}`, { // eslint-disable-line
    updatedFiltersCount,
    updatedFilterTextsCount,
  });
};

Filters.updateCleanFilterActivation = () => {
  const disabledDirtyFiltersCount = Filters.update({
    isActive: true,
    dirty: true,
  }, {
    $set: { isActive: false },
  }, { bypassCollection2: true, multi: true });
  const enabledCleanFiltersCount = Filters.update({
    isActive: false,
    dirty: { $ne: true },
  }, {
    $set: { isActive: true },
  }, { bypassCollection2: true, multi: true });

  console.log(`Filter Sync: Result of filter activation`, { // eslint-disable-line
    disabledDirtyFiltersCount,
    enabledCleanFiltersCount,
  });
};


Filters.wipeFilters = (onlyDirty = true) => {
  const selector = onlyDirty ? { dirty: true } : {};
  const removedFilterCount = Filters.remove(selector);
  const removedFilterTextCount = FilterTexts.remove(selector);
  console.log(`result of filter purging with onlyDirty=${onlyDirty}`, { // eslint-disable-line
    removedFilterCount,
    removedFilterTextCount,
  });
};

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

Filters.invalidateFilterCaches = () => {
  log('Filters: Invalidating filter caches...'); // eslint-disable.line
  Meteor.defer(() => {
    Filters.find().fetch().forEach(filter => filter.invalidateProductIdCache());
  });
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

Filters.helpers({
  upsertLocalizedText({ locale, filterOptionValue, ...rest }) {
    const localizedData = { locale, ...rest };
    const selector = {
      filterId: this._id,
      filterOptionValue: filterOptionValue || { $eq: null },
      locale,
    };
    FilterTexts.upsert(selector, {
      $set: {
        updated: new Date(),
        ...localizedData,
        filterOptionValue: filterOptionValue || null,
      },
    }, { bypassCollection2: true });
    Filters.update({
      _id: this._id,
    }, {
      $set: {
        updated: new Date(),
      },
    });
    return FilterTexts.findOne(selector);
  },
  getLocalizedTexts(locale, optionValue) {
    const parsedLocale = new Locale(locale);
    return Filters.getLocalizedTexts(this._id, optionValue, parsedLocale);
  },
  optionObject(filterOption) {
    return {
      filterOption,
      getLocalizedTexts: this.getLocalizedTexts,
      ...this,
    };
  },

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
    if (this.options) {
      cache.productIds = this.options.reduce((accumulator, option) => ({
        ...accumulator,
        [option]: this.collectProductIds({ value: option }),
      }), {});
    }
    return cache;
  },
  invalidateProductIdCache() {
    log(`Filters: Rebuilding ${this.key}`); // eslint-disable.line
    const { productIds, ...productIdMap } = this.buildProductIdMap();
    Filters.update({ _id: this._id }, {
      $set: {
        _cache: {
          ...productIdMap,
          productIds: Object.entries(productIds),
        },
      },
    });
  },
  cache() {
    if (!this._cache) return {}; // eslint-disable-line
    return {
      allProductIds: this._cache.allProductIds, // eslint-disable-line
      productIds: this._cache.productIds.reduce((accumulator, [key, value]) => ({ // eslint-disable-line
        ...accumulator,
        [key]: value,
      }), {}),
    };
  },
  productIds({ values, forceLiveCollection }) {
    const { productIds, allProductIds } = forceLiveCollection
      ? this.buildProductIdMap()
      : (this.cache() || this.buildProductIdMap());

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
