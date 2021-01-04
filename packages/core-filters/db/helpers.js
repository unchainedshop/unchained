import 'meteor/dburles:collection-helpers';
import { Locale } from 'locale';
import { findLocalizedText } from 'meteor/unchained:core';
import { log } from 'meteor/unchained:core-logger';
import { Products, ProductStatus } from 'meteor/unchained:core-products';
import {
  Assortments,
  AssortmentFilters,
} from 'meteor/unchained:core-assortments';
import { FilterTypes } from './schema';
import { Filters, FilterTexts } from './collections';
import { FilterDirector } from '../director';
import intersectProductIds from '../search/intersect-product-ids';
import { searchProducts } from '../search';

const util = require('util');
const zlib = require('zlib');

const MAX_UNCOMPRESSED_FILTER_PRODUCTS = 1000;

Assortments.helpers({
  async searchProducts({
    query,
    ignoreChildAssortments,
    forceLiveCollection,
    ...rest
  }) {
    const productIds = this.productIds({
      forceLiveCollection,
      ignoreChildAssortments,
    });
    const filterIds = this.filterAssignments().map(({ filterId }) => filterId);
    return searchProducts({
      query: {
        filterIds,
        productIds,
        ...query,
      },
      forceLiveCollection,
      ...rest,
    });
  },
});

AssortmentFilters.helpers({
  filter() {
    return Filters.findOne({ _id: this.filterId });
  },
});

Filters.createFilter = (
  { locale, title, type, isActive = false, authorId, ...filterData },
  { skipInvalidation = false } = {}
) => {
  const filterId = Filters.insert({
    isActive,
    created: new Date(),
    type: FilterTypes[type],
    authorId,
    ...filterData,
  });
  const filterObject = Filters.findOne({ _id: filterId });
  if (locale) {
    filterObject.upsertLocalizedText(locale, {
      filterOptionValue: null,
      title,
      authorId,
    });
  }
  if (!skipInvalidation) {
    filterObject.invalidateProductIdCache();
  }
  return filterObject;
};

Filters.updateFilter = (
  { filterId, ...filter },
  { skipInvalidation = false } = {}
) => {
  const modifier = {
    $set: {
      ...filter,
      updated: new Date(),
    },
  };
  Filters.update({ _id: filterId }, modifier);
  const filterObject = Filters.findOne({ _id: filterId });
  if (!skipInvalidation) {
    filterObject.invalidateProductIdCache();
  }
  return filterObject;
};

Filters.removeFilter = ({ filterId }) => {
  return Filters.remove({ _id: filterId });
};

Filters.getLocalizedTexts = (filterId, filterOptionValue, locale) =>
  findLocalizedText(
    FilterTexts,
    {
      filterId,
      filterOptionValue: filterOptionValue || { $eq: null },
    },
    locale
  );

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
    {},
    dirtyModifier,
    collectionUpdateOptions
  );
  const updatedFilterTextsCount = FilterTexts.update(
    {},
    dirtyModifier,
    collectionUpdateOptions
  );
  const timestamp = new Date();
  log(`Filter Sync: Marked Filters dirty at timestamp ${timestamp}`, {
    // eslint-disable-line
    updatedFiltersCount,
    updatedFilterTextsCount,
    level: 'verbose',
  });
  return new Date();
};

Filters.findFilter = ({ filterId }) => {
  return Filters.findOne(filterId);
};

Filters.findFilters = ({ limit, offset, includeInactive }) => {
  const selector = {};
  if (!includeInactive) selector.isActive = true;
  return Filters.find(selector, { skip: offset, limit }).fetch();
};

Filters.cleanFiltersByReferenceDate = (referenceDate) => {
  const selector = {
    dirty: true,
    $or: [
      {
        updated: { $gte: referenceDate },
      },
      {
        created: { $gte: referenceDate },
      },
    ],
  };
  const modifier = { $set: { dirty: false } };
  const collectionUpdateOptions = { bypassCollection2: true, multi: true };
  const updatedFiltersCount = Filters.update(
    selector,
    modifier,
    collectionUpdateOptions
  );
  const updatedFilterTextsCount = FilterTexts.update(
    selector,
    modifier,
    collectionUpdateOptions
  );
  log(
    `Filter Sync: Result of filter cleaning with referenceDate=${referenceDate}`,
    {
      updatedFiltersCount,
      updatedFilterTextsCount,
      level: 'verbose',
    }
  );
};

FilterTexts.findFilterTexts = ({ filterId, filterOptionValue }) => {
  return FilterTexts.find({
    filterId,
    filterOptionValue,
  }).fetch();
};

Filters.updateCleanFilterActivation = () => {
  const disabledDirtyFiltersCount = Filters.update(
    {
      isActive: true,
      dirty: true,
    },
    {
      $set: { isActive: false },
    },
    { bypassCollection2: true, multi: true }
  );
  const enabledCleanFiltersCount = Filters.update(
    {
      isActive: false,
      dirty: { $ne: true },
    },
    {
      $set: { isActive: true },
    },
    { bypassCollection2: true, multi: true }
  );

  log(`Filter Sync: Result of filter activation`, {
    disabledDirtyFiltersCount,
    enabledCleanFiltersCount,
    level: 'verbose',
  });
};

Filters.wipeFilters = (onlyDirty = true) => {
  const selector = onlyDirty ? { dirty: true } : {};
  const removedFilterCount = Filters.remove(selector);
  const removedFilterTextCount = FilterTexts.remove(selector);
  log(`Filter Sync: Result of filter purging with onlyDirty=${onlyDirty}`, {
    removedFilterCount,
    removedFilterTextCount,
    level: 'verbose',
  });
};

Filters.invalidateFilterCaches = () => {
  log('Filters: Start invalidating filter caches', { level: 'verbose' });
  Filters.find()
    .fetch()
    .forEach((filter) => filter.invalidateProductIdCache());
};

Filters.removeFilterOption = ({ filterId, filterOptionValue }) => {
  return Filters.update(filterId, {
    $set: {
      updated: new Date(),
    },
    $pull: {
      options: filterOptionValue,
    },
  });
};

Filters.helpers({
  upsertLocalizedText(locale, { filterOptionValue, ...fields }) {
    const selector = {
      filterId: this._id,
      filterOptionValue: filterOptionValue || { $eq: null },
      locale,
    };
    FilterTexts.upsert(selector, {
      $set: {
        updated: new Date(),
        ...fields,
      },
      $setOnInsert: {
        filterId: this._id,
        filterOptionValue: filterOptionValue || null,
        locale,
        created: new Date(),
      },
    });
    return FilterTexts.findOne(selector);
  },
  addOption({ option, localeContext, userId }) {
    const { value, title } = option;
    Filters.update(this._id, {
      $set: {
        updated: new Date(),
      },
      $addToSet: {
        options: value,
      },
    });

    this.upsertLocalizedText(localeContext.language, {
      authorId: userId,
      filterOptionValue: value,
      title,
    });
  },
  updateTexts({ texts, filterOptionValue, userId }) {
    return texts.map(({ locale, ...localizations }) =>
      this.upsertLocalizedText(locale, {
        ...localizations,
        authorId: userId,
        filterOptionValue,
      })
    );
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
    const selector = Promise.await(
      director.buildProductSelector(
        {
          status: ProductStatus.ACTIVE,
        },
        {
          key: this.key,
          value,
        }
      )
    );
    if (!selector) return [];
    const products = Products.find(selector, { fields: { _id: true } }).fetch();
    return products.map(({ _id }) => _id);
  },
  buildProductIdMap() {
    const cache = {
      allProductIds: this.collectProductIds(),
    };
    if (this.type === FilterTypes.SWITCH) {
      cache.productIds = {
        true: this.collectProductIds({ value: true }),
        false: this.collectProductIds({ value: false }),
      };
    } else {
      cache.productIds = (this.options || []).reduce(
        (accumulator, option) => ({
          ...accumulator,
          [option]: this.collectProductIds({ value: option }),
        }),
        {}
      );
    }

    return cache;
  },
  invalidateProductIdCache() {
    log(`Filters: Rebuilding ${this.key}`, { level: 'verbose' }); // eslint-disable.line
    const { productIds, allProductIds } = this.buildProductIdMap();
    const cache = {
      allProductIds,
      productIds: Object.entries(productIds),
    };

    const gzip = util.promisify(zlib.gzip);
    const compressedCache =
      allProductIds.length > MAX_UNCOMPRESSED_FILTER_PRODUCTS
        ? Promise.await(gzip(JSON.stringify(cache)))
        : null;

    Filters.update(
      { _id: this._id },
      {
        $set: {
          _cache: compressedCache
            ? {
                compressed: compressedCache,
              }
            : cache,
        },
      }
    );
  },
  cache() {
    // eslint-disable-next-line
    if (!this._cache) return null;
    // eslint-disable-next-line
    if (!this._isCacheTransformed) {
      // eslint-disable-next-line
      if (this._cache.compressed) {
        const gunzip = util.promisify(zlib.gunzip);
        this._cache = JSON.parse(Promise.await(gunzip(this._cache.compressed))); // eslint-disable-line
      }
      // eslint-disable-next-line
      this._cache = {
        // eslint-disable-next-line
        allProductIds: this._cache.allProductIds,
        // eslint-disable-next-line
        productIds: this._cache.productIds.reduce(
          (accumulator, [key, value]) => ({
            ...accumulator,
            [key]: value,
          }),
          {}
        ),
      };
      this._isCacheTransformed = true; // eslint-disable-line
    }
    return this._cache; // eslint-disable-line
  },
  productIds({ values, forceLiveCollection }) {
    const { productIds, allProductIds } = forceLiveCollection
      ? this.buildProductIdMap()
      : this.cache() || this.buildProductIdMap();

    if (this.type === FilterTypes.SWITCH) {
      const [stringifiedBoolean] = values;
      if (stringifiedBoolean !== undefined) {
        if (
          !stringifiedBoolean ||
          stringifiedBoolean === 'false' ||
          stringifiedBoolean === '0'
        ) {
          return productIds.false;
        }
        return productIds.true;
      }
      return allProductIds;
    }

    const reducedByValues = values.reduce((accumulator, value) => {
      const additionalValues =
        value === undefined ? allProductIds : productIds[value];
      return [...accumulator, ...(additionalValues || [])];
    }, []);
    return reducedByValues;
  },
  intersect({ values, forceLiveCollection, productIdSet }) {
    if (!values) return productIdSet;
    const filterOptionProductIds = this.productIds({
      values,
      forceLiveCollection,
    });
    const filterOptionProductIdSet = new Set(filterOptionProductIds);
    return new Set(
      [...productIdSet].filter((x) => filterOptionProductIdSet.has(x))
    );
  },
  optionsForFilterType(type) {
    if (type === FilterTypes.SWITCH) return ['true', 'false'];
    return this.options || [];
  },
  loadedOptions({ values, forceLiveCollection, productIdSet }) {
    const mappedOptions = this.optionsForFilterType(this.type)
      .map((value) => {
        const filteredProductIds = this.intersect({
          values: [value],
          forceLiveCollection,
          productIdSet,
        });
        if (!filteredProductIds.size) return null;
        return {
          definition: () => this.optionObject(value),
          filteredProducts: filteredProductIds.size,
          isSelected: values ? values.indexOf(value) !== -1 : false,
        };
      })
      .filter(Boolean);
    return mappedOptions;
  },
  load({ filterQuery, forceLiveCollection, allProductIdsSet, otherFilters }) {
    const values = filterQuery[this.key];

    // The examinedProductIdSet is a set of product id's that:
    // - Fit this filter generally
    // - Are part of the preselected product id array
    const examinedProductIdSet = this.intersect({
      values: [undefined],
      forceLiveCollection,
      productIdSet: allProductIdsSet,
    });

    // The filteredProductIdSet is a set of product id's that:
    // - Are filtered by all other filters
    // - Are filtered by the currently selected value of this filter
    // or if there is no currently selected value:
    // - Is the same like examinedProductIdSet
    const queryWithoutOwnFilter = { ...filterQuery };
    delete queryWithoutOwnFilter[this.key];
    const filteredByOtherFiltersSet = intersectProductIds({
      productIds: examinedProductIdSet,
      filters: otherFilters.filter(
        (otherFilter) => otherFilter.key !== this.key
      ),
      filterQuery: queryWithoutOwnFilter,
      forceLiveCollection,
    });
    const filteredProductIdSet = this.intersect({
      values: values || [undefined],
      forceLiveCollection,
      productIdSet: filteredByOtherFiltersSet,
    });

    return {
      definition: this,
      examinedProducts: examinedProductIdSet.size,
      filteredProducts: filteredProductIdSet.size, // TODO: Implement
      isSelected: Object.prototype.hasOwnProperty.call(filterQuery, this.key),
      options: () => {
        // The current base for options should be an array of product id's that:
        // - Are part of the preselected product id array
        // - Fit this filter generally
        // - Are filtered by all other filters
        // - Are not filtered by the currently selected value of this filter
        return this.loadedOptions({
          values,
          forceLiveCollection,
          productIdSet: filteredByOtherFiltersSet,
        });
      },
    };
  },
});
