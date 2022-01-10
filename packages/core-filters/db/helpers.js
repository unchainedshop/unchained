import 'meteor/dburles:collection-helpers';
import { Locale } from 'locale';
import { findLocalizedText } from 'meteor/unchained:utils';
import { log } from 'meteor/unchained:logger';
import { Products, ProductStatus } from 'meteor/unchained:core-products';
import {
  Assortments,
  AssortmentFilters,
} from 'meteor/unchained:core-assortments';
import { emit } from 'meteor/unchained:events';
import { FilterTypes } from './schema';
import { Filters, FilterTexts } from './collections';
import { FilterDirector } from '../director';
import { searchProducts } from '../search';
import intersectSet from '../intersect-set';

const util = require('util');
const zlib = require('zlib');

const MAX_UNCOMPRESSED_FILTER_PRODUCTS = 1000;

// const buildFindSelector = ({ includeInactive = false }) => {
//   const selector = {};
//   if (!includeInactive) selector.isActive = true;
//   return selector;
// };

// Assortments.helpers({
//   async searchProducts({
//     query,
//     ignoreChildAssortments,
//     forceLiveCollection,
//     ...options
//   }) {
//     const productIds = this.productIds({
//       forceLiveCollection,
//       ignoreChildAssortments,
//     });
//     const filterIds = this.filterAssignments().map(({ filterId }) => filterId);
//     return searchProducts({
//       query: {
//         filterIds,
//         productIds,
//         ...query,
//       },
//       forceLiveCollection,
//       ...options,
//     });
//   },
// });


// // Move to types
// AssortmentFilters.helpers({
//   filter() {
//     return Filters.findOne({ _id: this.filterId });
//   },
// });


// Filters.createFilter = (
//   { locale, title, type, isActive = false, authorId, ...filterData },
//   { skipInvalidation = false } = {}
// ) => {
//   const filterId = Filters.insert({
//     isActive,
//     created: new Date(),
//     type: FilterTypes[type],
//     authorId,
//     ...filterData,
//   });
//   const filterObject = Filters.findOne({ _id: filterId });
//   if (locale) {
//     filterObject.upsertLocalizedText(locale, {
//       filterOptionValue: null,
//       title,
//       authorId,
//     });
//   }
//   if (!skipInvalidation) {
//     filterObject.invalidateProductIdCache();
//   }
//   emit('FILTER_CREATE', { filter: filterObject });
//   return filterObject;
// };

// Filters.updateFilter = (
//   { filterId, ...filter },
//   { skipInvalidation = false } = {}
// ) => {
//   const modifier = {
//     $set: {
//       ...filter,
//       updated: new Date(),
//     },
//   };
//   Filters.update({ _id: filterId }, modifier);
//   const filterObject = Filters.findOne({ _id: filterId });
//   if (!skipInvalidation) {
//     filterObject.invalidateProductIdCache();
//   }
//   emit('FILTER_UPDATE', { filter: filterObject });
//   return filterObject;
// };

// Filters.removeFilter = ({ filterId }) => {
//   // Move to mutation
//   // AssortmentFilters.removeFilters({ filterId });
//   const result = Filters.remove({ _id: filterId });
//   emit('FILTER_REMOVE', { filterId });
//   return result;
// };

// Filters.getLocalizedTexts = (filterId, filterOptionValue, locale) =>
//   findLocalizedText(
//     FilterTexts,
//     {
//       filterId,
//       filterOptionValue: filterOptionValue || { $eq: null },
//     },
//     locale
//   );

// Filters.filterExists = ({ filterId }) => {
//   return !!Filters.find({ _id: filterId }).count();
// };

// Filters.findFilter = ({ filterId }) => {
//   return Filters.findOne({ _id: filterId });
// };

// Filters.findFilters = ({ limit, offset, ...query }) => {
//   return Filters.find(buildFindSelector(query), {
//     skip: offset,
//     limit,
//   }).fetch();
// };

// Filters.count = async (query) => {
//   const count = await Filters.rawCollection().countDocuments(
//     buildFindSelector(query)
//   );
//   return count;
// };

// FilterTexts.findFilterTexts = ({ filterId, filterOptionValue }) => {
//   return FilterTexts.find({
//     filterId,
//     filterOptionValue,
//   }).fetch();
// };

// Filters.invalidateCache = (selector) => {
//   log('Filters: Start invalidating filter caches', { level: 'verbose' });
//   Filters.find(selector || {})
//     .fetch()
//     .forEach((filter) => filter.invalidateProductIdCache());
// };

// Filters.removeFilterOption = ({ filterId, filterOptionValue }) => {
//   return Filters.update(
//     { _id: filterId },
//     {
//       $set: {
//         updated: new Date(),
//       },
//       $pull: {
//         options: filterOptionValue,
//       },
//     }
//   );
// };

Filters.helpers({
  // upsertLocalizedText(locale, { filterOptionValue, ...fields }) {
  //   const selector = {
  //     filterId: this._id,
  //     filterOptionValue: filterOptionValue || { $eq: null },
  //     locale,
  //   };
  //   FilterTexts.upsert(selector, {
  //     $set: {
  //       updated: new Date(),
  //       ...fields,
  //     },
  //     $setOnInsert: {
  //       filterId: this._id,
  //       filterOptionValue: filterOptionValue || null,
  //       locale,
  //       created: new Date(),
  //     },
  //   });
  //   return FilterTexts.findOne(selector);
  // },
  // addOption({ option, localeContext, userId }) {
  //   const { value, title } = option;
  //   Filters.update(this._id, {
  //     $set: {
  //       updated: new Date(),
  //     },
  //     $addToSet: {
  //       options: value,
  //     },
  //   });

  //   this.upsertLocalizedText(localeContext.language, {
  //     authorId: userId,
  //     filterOptionValue: value,
  //     title,
  //   });
  // },
  // updateTexts({ texts, filterOptionValue, userId }) {
  //   return texts.map(({ locale, ...localizations }) =>
  //     this.upsertLocalizedText(locale, {
  //       ...localizations,
  //       authorId: userId,
  //       filterOptionValue,
  //     })
  //   );
  // },
  // getLocalizedTexts(locale, optionValue) {
  //   const parsedLocale = new Locale(locale);
  //   return Filters.getLocalizedTexts(this._id, optionValue, parsedLocale);
  // },
  // optionObject(filterOption) {
  //   return {
  //     filterOption,
  //     getLocalizedTexts: this.getLocalizedTexts,
  //     ...this,
  //   };
  // },

  collectProductIds({ value, ...options } = {}) {
    const director = new FilterDirector({ filter: this, ...options });
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
  // buildProductIdMap() {
  //   const cache = {
  //     allProductIds: this.collectProductIds(),
  //   };
  //   if (this.type === FilterTypes.SWITCH) {
  //     cache.productIds = {
  //       true: this.collectProductIds({ value: true }),
  //       false: this.collectProductIds({ value: false }),
  //     };
  //   } else {
  //     cache.productIds = (this.options || []).reduce(
  //       (accumulator, option) => ({
  //         ...accumulator,
  //         [option]: this.collectProductIds({ value: option }),
  //       }),
  //       {}
  //     );
  //   }

  //   return cache;
  // },
  // invalidateProductIdCache() {
  //   log(`Filters: Rebuilding ${this.key}`, { level: 'verbose' }); // eslint-disable.line
  //   const { productIds, allProductIds } = this.buildProductIdMap();
  //   const cache = {
  //     allProductIds,
  //     productIds: Object.entries(productIds),
  //   };

  //   const gzip = util.promisify(zlib.gzip);
  //   const compressedCache =
  //     allProductIds.length > MAX_UNCOMPRESSED_FILTER_PRODUCTS
  //       ? Promise.await(gzip(JSON.stringify(cache)))
  //       : null;

  //   Filters.update(
  //     { _id: this._id },
  //     {
  //       $set: {
  //         _cache: compressedCache
  //           ? {
  //               compressed: compressedCache,
  //             }
  //           : cache,
  //       },
  //     }
  //   );
  // },
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
  optionsForFilterType(type) {
    if (type === FilterTypes.SWITCH) return ['true', 'false'];
    return this.options || [];
  },
  loadedOptions({ values, forceLiveCollection, productIdSet, director }) {
    const mappedOptions = this.optionsForFilterType(this.type)
      .map((value) => {
        const filterOptionProductIds = this.productIds({
          values: [value],
          forceLiveCollection,
        });
        const filteredProductIds = intersectSet(
          productIdSet,
          new Set(filterOptionProductIds)
        );
        if (!filteredProductIds.length) return null;
        return {
          definition: () => this.optionObject(value),
          filteredProducts: director.aggregateProductIds([
            ...filteredProductIds,
          ]).length,
          filteredProductsCount: director.aggregateProductIds([
            ...filteredProductIds,
          ]).length,
          isSelected: values ? values.indexOf(value) !== -1 : false,
        };
      })
      .filter(Boolean);
    return mappedOptions;
  },
  load({
    filterQuery,
    forceLiveCollection,
    allProductIdsSet,
    otherFilters,
    director,
    ...options
  }) {
    const values = filterQuery[this.key];

    // The examinedProductIdSet is a set of product id's that:
    // - Fit this filter generally
    // - Are part of the preselected product id array
    const filterProductIds = this.productIds({
      values: [undefined],
      forceLiveCollection,
    });
    const examinedProductIdSet = intersectSet(
      allProductIdsSet,
      new Set(filterProductIds)
    );

    // The filteredProductIdSet is a set of product id's that:
    // - Are filtered by all other filters
    // - Are filtered by the currently selected value of this filter
    // or if there is no currently selected value:
    // - Is the same like examinedProductIdSet
    const filteredByOtherFiltersSet = otherFilters
      .filter((otherFilter) => otherFilter.key !== this.key)
      .reduce((productIdSet, filter) => {
        if (!filterQuery[filter.key]) return productIdSet;
        const otherFilterProductIds = filter.productIds({
          values: filterQuery[filter.key],
          forceLiveCollection,
        });
        return intersectSet(productIdSet, new Set(otherFilterProductIds));
      }, new Set(examinedProductIdSet));

    const filterProductIdsForValues = values
      ? this.productIds({
          values,
          forceLiveCollection,
        })
      : filterProductIds;
    const filteredProductIdSet = intersectSet(
      filteredByOtherFiltersSet,
      new Set(filterProductIdsForValues)
    );

    return {
      definition: this,
      examinedProducts: director.aggregateProductIds([...examinedProductIdSet])
        .length,
      productsCount: director.aggregateProductIds([...examinedProductIdSet])
        .length,
      filteredProducts: director.aggregateProductIds([...filteredProductIdSet])
        .length,
      filteredProductsCount: director.aggregateProductIds([
        ...filteredProductIdSet,
      ]).length,
      isSelected: Object.prototype.hasOwnProperty.call(filterQuery, this.key),
      options: () => {
        // The current base for options should be an array of product id's that:
        // - Are part of the preselected product id array
        // - Fit this filter generally
        // - Are filtered by all other filters
        // - Are not filtered by the currently selected value of this filter
        return this.loadedOptions({
          director,
          values,
          forceLiveCollection,
          productIdSet: filteredByOtherFiltersSet,
        });
      },
    };
  },
});
