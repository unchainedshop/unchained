import 'meteor/dburles:collection-helpers';
import { Countries } from 'meteor/unchained:core-countries';
import { Products, ProductStatus } from 'meteor/unchained:core-products';
import { slugify } from 'meteor/unchained:utils';
import { Filters } from 'meteor/unchained:core-filters';
import { findLocalizedText } from 'meteor/unchained:core';

import { Locale } from 'locale';
import * as Collections from './collections';

function eqSet(as, bs) {
  if (as.size !== bs.size) return false;
  for (const a of as) if (!bs.has(a)) return false; // eslint-disable-line
  for (const b of bs) if (!as.has(b)) return false; // eslint-disable-line
  return true;
}

Collections.Assortments.createAssortment = ({
  locale, title, isBase = false, isActive = true, isRoot = false, meta = {},
}) => {
  const assortment = {
    created: new Date(),
    isBase,
    isActive,
    isRoot,
    sequence: Collections.Assortments.getNewSequence(),
    meta,
  };
  const assortmentId = Collections.Assortments.insert(assortment);
  const assortmentObject = Collections.Assortments.findOne({ _id: assortmentId });
  assortmentObject.upsertLocalizedText({ locale, title });
  return assortmentObject;
};

Collections.Assortments.sync = (syncFn) => {
  const referenceDate = Collections.Assortments.markAssortmentTreeDirty();
  syncFn(referenceDate);
  Collections.Assortments.cleanDirtyAssortmentTreeByReferenceDate(referenceDate);
  Collections.Assortments.updateCleanAssortmentActivation();
  Collections.Assortments.wipeAssortments();
};

Collections.Assortments.markAssortmentTreeDirty = () => {
  const dirtyModifier = { $set: { dirty: true } };
  const collectionUpdateOptions = { bypassCollection2: true, multi: true };
  const updatedAssortmentCount = Collections.Assortments.update(
    {}, dirtyModifier, collectionUpdateOptions,
  );
  const updatedAssortmentTextsCount = Collections.AssortmentTexts.update(
    {}, dirtyModifier, collectionUpdateOptions,
  );
  const updatedAssortmentProductsCount = Collections.AssortmentProducts.update(
    {}, dirtyModifier, collectionUpdateOptions,
  );
  const updatedAssortmentLinksCount = Collections.AssortmentLinks.update(
    {}, dirtyModifier, collectionUpdateOptions,
  );
  const updatedAssortmentFiltersCount = Collections.AssortmentFilters.update(
    {}, dirtyModifier, collectionUpdateOptions,
  );
  const timestamp = new Date();
  console.log(`Assortment Sync: Marked Assortment tree dirty at timestamp ${timestamp}`, { // eslint-disable-line
    updatedAssortmentCount,
    updatedAssortmentTextsCount,
    updatedAssortmentProductsCount,
    updatedAssortmentLinksCount,
    updatedAssortmentFiltersCount,
  });
  return new Date();
};

Collections.Assortments.cleanDirtyAssortmentTreeByReferenceDate = (referenceDate) => {
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
  const updatedAssortmentCount = Collections.Assortments.update(
    selector, modifier, collectionUpdateOptions,
  );
  const updatedAssortmentTextsCount = Collections.AssortmentTexts.update(
    selector, modifier, collectionUpdateOptions,
  );
  const updatedAssortmentProductsCount = Collections.AssortmentProducts.update(
    selector, modifier, collectionUpdateOptions,
  );
  const updatedAssortmentLinksCount = Collections.AssortmentLinks.update(
    selector, modifier, collectionUpdateOptions,
  );
  const updatedAssortmentFiltersCount = Collections.AssortmentLinks.update(
    selector, modifier, collectionUpdateOptions,
  );
  console.log(`Assortment Sync: Result of assortment cleaning with referenceDate=${referenceDate}`, { // eslint-disable-line
    updatedAssortmentCount,
    updatedAssortmentTextsCount,
    updatedAssortmentProductsCount,
    updatedAssortmentLinksCount,
    updatedAssortmentFiltersCount,
  });
};

Collections.Assortments.updateCleanAssortmentActivation = () => {
  const disabledDirtyAssortmentsCount = Collections.Assortments.update({
    isActive: true,
    dirty: true,
  }, {
    $set: { isActive: false },
  }, { bypassCollection2: true, multi: true });
  const enabledCleanAssortmentsCount = Collections.Assortments.update({
    isActive: false,
    dirty: { $ne: true },
  }, {
    $set: { isActive: true },
  }, { bypassCollection2: true, multi: true });

  console.log(`Assortment Sync: Result of assortment activation`, { // eslint-disable-line
    disabledDirtyAssortmentsCount,
    enabledCleanAssortmentsCount,
  });
};


Collections.Assortments.wipeAssortments = (onlyDirty = true) => {
  const selector = onlyDirty ? { dirty: true } : {};
  const removedAssortmentCount = Collections.Assortments.remove(selector);
  const removedAssortmentTextCount = Collections.AssortmentTexts.remove(selector);
  const removedAssortmentProductsCount = Collections.AssortmentProducts.remove(selector);
  const removedAssortmentLinksCount = Collections.AssortmentLinks.remove(selector);
  const removedAssortmentFiltersCount = Collections.AssortmentLinks.remove(selector);

  console.log(`result of assortment purging with onlyDirty=${onlyDirty}`, { // eslint-disable-line
    removedAssortmentCount,
    removedAssortmentTextCount,
    removedAssortmentProductsCount,
    removedAssortmentLinksCount,
    removedAssortmentFiltersCount,
  });
};

Collections.Assortments.getNewSequence = (oldSequence) => {
  const sequence = (oldSequence + 1) || (Collections.Assortments.find({}).count() * 10);
  if (Collections.Assortments.find({ sequence }).count() > 0) {
    return Collections.Assortments.getNewSequence(sequence);
  }
  return sequence;
};

Collections.Assortments.getLocalizedTexts = (
  assortmentId, locale,
) => findLocalizedText(Collections.AssortmentTexts, { assortmentId }, locale);

Collections.AssortmentTexts.getUnusedSlug = (strValue, scope, isAlreadySlugified) => {
  const slug = isAlreadySlugified ? strValue : `${slugify(strValue)}`;
  if (Collections.AssortmentTexts.find({ ...scope, slug }).count() > 0) {
    return Collections.AssortmentTexts.getUnusedSlug(`${slug}-`, scope, true);
  }
  return slug;
};

Collections.AssortmentProducts.getNewSortKey = (assortmentId) => {
  const lastAssortmentProduct = Collections.AssortmentProducts.findOne({
    assortmentId,
  }, {
    sort: { sortKey: 1 },
  }) || { sortKey: 0 };
  return lastAssortmentProduct.sortKey + 1;
};

Collections.AssortmentFilters.getNewSortKey = (assortmentId) => {
  const lastAssortmentFilter = Collections.AssortmentFilters.findOne({
    assortmentId,
  }, {
    sort: { sortKey: 1 },
  }) || { sortKey: 0 };
  return lastAssortmentFilter.sortKey + 1;
};

Collections.AssortmentLinks.getNewSortKey = (parentAssortmentId) => {
  const lastAssortmentProduct = Collections.AssortmentLinks.findOne({
    parentAssortmentId,
  }, {
    sort: { sortKey: 1 },
  }) || { sortKey: 0 };
  return lastAssortmentProduct.sortKey + 1;
};

Products.helpers({
  assortmentIds() {
    return Collections.AssortmentProducts
      .find({ productId: this._id }, { fields: { assortmentId: true } })
      .fetch()
      .map(({ assortmentId: id }) => id);
  },
  assortments({ includeInactive = false } = {}) {
    const assortmentIds = this.assortmentIds();
    const selector = { _id: { $in: assortmentIds } };
    if (!includeInactive) {
      selector.isActive = true;
    }
    return Collections.Assortments.find(selector).fetch();
  },
  siblings({ assortmentId, includeDrafts = false } = {}) {
    const assortmentIds = assortmentId
      ? [assortmentId]
      : this.assortmentIds();
    if (!assortmentIds.length) return [];
    const productIds = Collections.AssortmentProducts
      .find({
        $and: [{
          productId: { $ne: this._id },
        }, {
          assortmentId: { $in: assortmentIds },
        }],
      })
      .fetch()
      .map(({ productId: curProductId }) => curProductId);

    const productSelector = {
      _id: { $in: productIds },
      status: { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] },
    };
    if (!includeDrafts) {
      productSelector.status = ProductStatus.ACTIVE;
    }
    return Products.find(productSelector).fetch();
  },
});

Collections.Assortments.helpers({
  country() {
    return Countries.findOne({ isoCode: this.countryCode });
  },
  upsertLocalizedText({
    locale, title, slug: propablyUsedSlug, ...rest
  }) {
    const slug = Collections.AssortmentTexts
      .getUnusedSlug(propablyUsedSlug || title || this._id, {
        assortmentId: { $ne: this._id },
      }, !!propablyUsedSlug);

    Collections.AssortmentTexts.upsert({
      assortmentId: this._id,
      locale,
    }, {
      $set: {
        title,
        locale,
        slug,
        ...rest,
        updated: new Date(),
      },
    }, { bypassCollection2: true });

    Collections.Assortments.update({
      _id: this._id,
    }, {
      $set: {
        updated: new Date(),
      },
      $addToSet: {
        slugs: slug,
      },
    });
    return Collections.AssortmentTexts.findOne({ assortmentId: this._id, locale });
  },
  getLocalizedTexts(locale) {
    const parsedLocale = new Locale(locale);
    return Collections.Assortments.getLocalizedTexts(this._id, parsedLocale);
  },
  addProduct({ productId }, { skipInvalidation = false } = {}) {
    const sortKey = Collections.AssortmentProducts.getNewSortKey(this._id);
    Collections.AssortmentProducts.remove({
      assortmentId: this._id,
      productId,
    });
    const assortmentProductId = Collections.AssortmentProducts.insert({
      assortmentId: this._id,
      productId,
      sortKey,
      created: new Date(),
    });
    if (!skipInvalidation) {
      this.invalidateProductIdCache();
    }
    return Collections.AssortmentProducts.findOne({ _id: assortmentProductId });
  },
  addLink({ assortmentId }, { skipInvalidation = false } = {}) {
    const sortKey = Collections.AssortmentLinks.getNewSortKey(this._id);
    Collections.AssortmentLinks.remove({
      parentAssortmentId: this._id,
      childAssortmentId: assortmentId,
    });
    const assortmentProductId = Collections.AssortmentLinks.insert({
      parentAssortmentId: this._id,
      childAssortmentId: assortmentId,
      sortKey,
      created: new Date(),
    });
    if (!skipInvalidation) {
      this.invalidateProductIdCache();
    }
    return Collections.AssortmentLinks.findOne({ _id: assortmentProductId });
  },
  addFilter({ filterId }) {
    const sortKey = Collections.AssortmentFilters.getNewSortKey(this._id);
    Collections.AssortmentFilters.remove({
      assortmentId: this._id,
      filterId,
    });
    const assortmentFilterId = Collections.AssortmentFilters.insert({
      assortmentId: this._id,
      filterId,
      sortKey,
      created: new Date(),
    });
    return Collections.AssortmentFilters.findOne({ _id: assortmentFilterId });
  },
  productAssignments() {
    return Collections.AssortmentProducts
      .find({ assortmentId: this._id }, {
        sort: { sortKey: 1 },
      })
      .fetch();
  },
  filterAssignments() {
    return Collections.AssortmentFilters
      .find({ assortmentId: this._id }, {
        sort: { sortKey: 1 },
      })
      .fetch();
  },
  productIds({ forceLiveCollection = false } = {}) {
    if (!this._cachedProductIds || forceLiveCollection) {  // eslint-disable-line
      return this.collectProductIdCache() || [];
    }
    return this._cachedProductIds; // eslint-disable-line
  },
  filters({
    query,
    forceLiveCollection = false,
    includeInactive = false,
  } = {}) {
    const productIds = this.productIds({ forceLiveCollection });
    const filterIds = Collections.AssortmentFilters
      .find({ assortmentId: this._id }, {
        sort: { sortKey: 1 },
      })
      .fetch()
      .map(({ filterId }) => filterId);
    return Filters.filterFilters({
      filterIds,
      productIds,
      query,
      forceLiveCollection,
      includeInactive,
    });
  },
  products({
    limit = 10, offset = 0, query,
    forceLiveCollection = false,
    includeInactive = false,
  } = {}) {
    const productIds = this.productIds({ forceLiveCollection });
    const selector = {
      status: { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] },
    };
    if (!includeInactive) {
      selector.status = ProductStatus.ACTIVE;
    }
    const options = { skip: offset, limit };

    const filteredProductIds = Filters.filterProductIds({
      productIds,
      query,
      forceLiveCollection,
    });

    const filteredSelector = {
      ...selector,
      _id: { $in: filteredProductIds },
    };

    const unfilteredSelector = {
      ...selector,
      _id: { $in: productIds },
    };

    return {
      filteredProductsPointer: Products.find(filteredSelector, options),
      totalCount: () => Products.find(unfilteredSelector, options).count(),
      filteredCount() {
        return this.filteredProductsPointer.count();
      },
      items() {
        return this.filteredProductsPointer.fetch();
      },
    };
  },
  linkedAssortments() {
    return Collections.AssortmentLinks
      .find({
        $or: [
          { parentAssortmentId: this._id },
          { childAssortmentId: this._id },
        ],
      }, {
        sort: { sortKey: 1 },
      })
      .fetch();
  },
  children({ includeInactive = false } = {}) {
    const assortmentIds = Collections.AssortmentLinks
      .find({ parentAssortmentId: this._id }, {
        fields: { childAssortmentId: 1 },
        sort: { sortKey: 1 },
      })
      .fetch()
      .map(({ childAssortmentId }) => childAssortmentId);

    const selector = { _id: { $in: assortmentIds } };
    if (!includeInactive) {
      selector.isActive = true;
    }
    return Collections.Assortments.find(selector).fetch();
  },
  parents({ includeInactive = false } = {}) {
    const assortmentIds = Collections.AssortmentLinks
      .find({ childAssortmentId: this._id }, {
        fields: { parentAssortmentId: 1 },
        sort: { sortKey: 1 },
      })
      .fetch()
      .map(({ parentAssortmentId }) => parentAssortmentId);

    const selector = { _id: { $in: assortmentIds } };
    if (!includeInactive) {
      selector.isActive = true;
    }
    return Collections.Assortments.find(selector).fetch();
  },
  collectProductIdCache(ownProductIdCache, linkedAssortmentsCache) {
    const ownProductIds = ownProductIdCache
      || this.productAssignments().map(({ productId }) => productId);

    const linkedAssortments = linkedAssortmentsCache
      || this.linkedAssortments();

    const childAssortments = linkedAssortments
      .filter(({ parentAssortmentId }) => (parentAssortmentId === this._id));

    const productIds = childAssortments
      .reduce((accumulator, childAssortment) => {
        const assortment = childAssortment.child();
        if (assortment) {
          return accumulator.concat(assortment.collectProductIdCache());
        }
        return accumulator;
      }, []);

    return [...ownProductIds, ...productIds];
  },
  invalidateProductIdCache(productIdCache) {
    const ownProductIds = this.productAssignments().map(({ productId }) => productId);
    const linkedAssortments = this.linkedAssortments();

    const childProductIds = productIdCache
        || this.collectProductIdCache(ownProductIds, linkedAssortments);

    const productIds = [...(new Set([...ownProductIds, ...childProductIds]))];

    if (eqSet(new Set(productIds), new Set(this._cachedProductIds))) { // eslint-disable-line
      return;
    }

    const updateCount = Collections.Assortments.update({ _id: this._id }, {
      $set: {
        updated: new Date(),
        _cachedProductIds: productIds,
      },
    });
    console.log(updateCount, this._id)

    linkedAssortments
      .filter(({ childAssortmentId }) => (childAssortmentId === this._id))
      .forEach((assortmentLink) => {
        const parent = assortmentLink.parent();
        if (parent) parent.invalidateProductIdCache(productIds);
      });
  },
});

Collections.AssortmentLinks.helpers({
  child() {
    return Collections.Assortments.findOne({ _id: this.childAssortmentId });
  },
  parent() {
    return Collections.Assortments.findOne({ _id: this.parentAssortmentId });
  },
});

Collections.AssortmentProducts.helpers({
  assortment() {
    return Collections.Assortments.findOne({ _id: this.assortmentId });
  },
  product() {
    return Products.findOne({ _id: this.productId });
  },
});

Collections.AssortmentFilters.helpers({
  assortment() {
    return Collections.Assortments.findOne({ _id: this.assortmentId });
  },
  filter() {
    return Filters.findOne({ _id: this.filterId });
  },
});
