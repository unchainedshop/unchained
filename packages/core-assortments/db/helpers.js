import 'meteor/dburles:collection-helpers';
import { Countries } from 'meteor/unchained:core-countries';
import { Products, ProductStatus } from 'meteor/unchained:core-products';
import { slugify } from 'meteor/unchained:utils';
import { Filters } from 'meteor/unchained:core-filters';
import { findLocalizedText } from 'meteor/unchained:core';

import { Locale } from 'locale';
import * as Collections from './collections';

function eqSet(as, bs) {
  return [...as].join(',') === [...bs].join(',');
}

Collections.Assortments.createAssortment = ({
  locale,
  title,
  isBase = false,
  isActive = true,
  isRoot = false,
  meta = {}
}) => {
  const assortment = {
    created: new Date(),
    isBase,
    isActive,
    isRoot,
    sequence: Collections.Assortments.getNewSequence(),
    meta
  };
  const assortmentId = Collections.Assortments.insert(assortment);
  const assortmentObject = Collections.Assortments.findOne({
    _id: assortmentId
  });
  assortmentObject.upsertLocalizedText({ locale, title });
  return assortmentObject;
};

Collections.Assortments.sync = syncFn => {
  const referenceDate = Collections.Assortments.markAssortmentTreeDirty();
  syncFn(referenceDate);
  Collections.Assortments.cleanDirtyAssortmentTreeByReferenceDate(
    referenceDate
  );
  Collections.Assortments.updateCleanAssortmentActivation();
  Collections.Assortments.wipeAssortments();
};

Collections.Assortments.markAssortmentTreeDirty = () => {
  const dirtyModifier = { $set: { dirty: true } };
  const collectionUpdateOptions = { bypassCollection2: true, multi: true };
  const updatedAssortmentCount = Collections.Assortments.update(
    {},
    dirtyModifier,
    collectionUpdateOptions
  );
  const updatedAssortmentTextsCount = Collections.AssortmentTexts.update(
    {},
    dirtyModifier,
    collectionUpdateOptions
  );
  const updatedAssortmentProductsCount = Collections.AssortmentProducts.update(
    {},
    dirtyModifier,
    collectionUpdateOptions
  );
  const updatedAssortmentLinksCount = Collections.AssortmentLinks.update(
    {},
    dirtyModifier,
    collectionUpdateOptions
  );
  const updatedAssortmentFiltersCount = Collections.AssortmentFilters.update(
    {},
    dirtyModifier,
    collectionUpdateOptions
  );
  const timestamp = new Date();
  console.log(`Assortment Sync: Marked Assortment tree dirty at timestamp ${timestamp}`, { // eslint-disable-line
      updatedAssortmentCount,
      updatedAssortmentTextsCount,
      updatedAssortmentProductsCount,
      updatedAssortmentLinksCount,
      updatedAssortmentFiltersCount
    }
  );
  return new Date();
};

Collections.Assortments.cleanDirtyAssortmentTreeByReferenceDate = referenceDate => {
  const selector = {
    dirty: true,
    $or: [
      {
        updated: { $gte: referenceDate }
      },
      {
        created: { $gte: referenceDate }
      }
    ]
  };
  const modifier = { $set: { dirty: false } };
  const collectionUpdateOptions = { bypassCollection2: true, multi: true };
  const updatedAssortmentCount = Collections.Assortments.update(
    selector,
    modifier,
    collectionUpdateOptions
  );
  const updatedAssortmentTextsCount = Collections.AssortmentTexts.update(
    selector,
    modifier,
    collectionUpdateOptions
  );
  const updatedAssortmentProductsCount = Collections.AssortmentProducts.update(
    selector,
    modifier,
    collectionUpdateOptions
  );
  const updatedAssortmentLinksCount = Collections.AssortmentLinks.update(
    selector,
    modifier,
    collectionUpdateOptions
  );
  const updatedAssortmentFiltersCount = Collections.AssortmentFilters.update(
    selector,
    modifier,
    collectionUpdateOptions
  );
  console.log(`Assortment Sync: Result of assortment cleaning with referenceDate=${referenceDate}`, { // eslint-disable-line
      updatedAssortmentCount,
      updatedAssortmentTextsCount,
      updatedAssortmentProductsCount,
      updatedAssortmentLinksCount,
      updatedAssortmentFiltersCount
    }
  );
};

Collections.Assortments.updateCleanAssortmentActivation = () => {
  const disabledDirtyAssortmentsCount = Collections.Assortments.update(
    {
      isActive: true,
      dirty: true
    },
    {
      $set: { isActive: false }
    },
    { bypassCollection2: true, multi: true }
  );
  const enabledCleanAssortmentsCount = Collections.Assortments.update(
    {
      isActive: false,
      dirty: { $ne: true }
    },
    {
      $set: { isActive: true }
    },
    { bypassCollection2: true, multi: true }
  );

  console.log(`Assortment Sync: Result of assortment activation`, { // eslint-disable-line
    disabledDirtyAssortmentsCount,
    enabledCleanAssortmentsCount
  });
};

Collections.Assortments.wipeAssortments = (onlyDirty = true) => {
  const selector = onlyDirty ? { dirty: true } : {};
  const removedAssortmentCount = Collections.Assortments.remove(selector);
  const removedAssortmentTextCount = Collections.AssortmentTexts.remove(
    selector
  );
  const removedAssortmentProductsCount = Collections.AssortmentProducts.remove(
    selector
  );
  const removedAssortmentLinksCount = Collections.AssortmentLinks.remove(
    selector
  );
  const removedAssortmentFiltersCount = Collections.AssortmentFilters.remove(
    selector
  );

  console.log(`result of assortment purging with onlyDirty=${onlyDirty}`, { // eslint-disable-line
    removedAssortmentCount,
    removedAssortmentTextCount,
    removedAssortmentProductsCount,
    removedAssortmentLinksCount,
    removedAssortmentFiltersCount
  });
};

Collections.Assortments.getNewSequence = oldSequence => {
  const sequence =
    oldSequence + 1 || Collections.Assortments.find({}).count() * 10;
  if (Collections.Assortments.find({ sequence }).count() > 0) {
    return Collections.Assortments.getNewSequence(sequence);
  }
  return sequence;
};

Collections.Assortments.getLocalizedTexts = (assortmentId, locale) =>
  findLocalizedText(Collections.AssortmentTexts, { assortmentId }, locale);

Collections.AssortmentTexts.getUnusedSlug = (
  strValue,
  scope,
  isAlreadySlugified
) => {
  const slug = isAlreadySlugified ? strValue : `${slugify(strValue)}`;
  if (Collections.AssortmentTexts.find({ ...scope, slug }).count() > 0) {
    return Collections.AssortmentTexts.getUnusedSlug(`${slug}-`, scope, true);
  }
  return slug;
};

Collections.AssortmentProducts.getNewSortKey = assortmentId => {
  const lastAssortmentProduct = Collections.AssortmentProducts.findOne(
    {
      assortmentId
    },
    {
      sort: { sortKey: 1 }
    }
  ) || { sortKey: 0 };
  return lastAssortmentProduct.sortKey + 1;
};

Collections.AssortmentProducts.updateManualOrder = ({
  sortKeys,
  skipInvalidation = false
}) => {
  const changedAssortmentProductIds = sortKeys.map(
    ({ assortmentProductId, sortKey }) => {
      Collections.AssortmentProducts.update(
        {
          _id: assortmentProductId
        },
        {
          $set: { sortKey: sortKey + 1, updated: new Date() }
        }
      );
      return assortmentProductId;
    }
  );
  const assortmentProducts = Collections.AssortmentProducts.find({
    _id: { $in: changedAssortmentProductIds }
  }).fetch();

  if (!skipInvalidation) {
    const assortmentIds = assortmentProducts.map(
      ({ assortmentId }) => assortmentId
    );
    Collections.Assortments.find({ _id: { $in: assortmentIds } }).forEach(
      assortment => assortment.invalidateProductIdCache()
    );
  }

  return assortmentProducts;
};

Collections.AssortmentFilters.getNewSortKey = assortmentId => {
  const lastAssortmentFilter = Collections.AssortmentFilters.findOne(
    {
      assortmentId
    },
    {
      sort: { sortKey: 1 }
    }
  ) || { sortKey: 0 };
  return lastAssortmentFilter.sortKey + 1;
};

Collections.AssortmentFilters.updateManualOrder = ({ sortKeys }) => {
  const changedAssortmentFilterIds = sortKeys.map(
    ({ assortmentFilterId, sortKey }) => {
      Collections.AssortmentFilters.update(
        {
          _id: assortmentFilterId
        },
        {
          $set: { sortKey: sortKey + 1, updated: new Date() }
        }
      );
      return assortmentFilterId;
    }
  );
  return Collections.AssortmentFilters.find({
    _id: { $in: changedAssortmentFilterIds }
  }).fetch();
};

Collections.AssortmentLinks.getNewSortKey = parentAssortmentId => {
  const lastAssortmentProduct = Collections.AssortmentLinks.findOne(
    {
      parentAssortmentId
    },
    {
      sort: { sortKey: 1 }
    }
  ) || { sortKey: 0 };
  return lastAssortmentProduct.sortKey + 1;
};

Collections.AssortmentLinks.updateManualOrder = ({ sortKeys }) => {
  const changedAssortmentLinkIds = sortKeys.map(
    ({ assortmentLinkId, sortKey }) => {
      Collections.AssortmentLinks.update(
        {
          _id: assortmentLinkId
        },
        {
          $set: { sortKey: sortKey + 1, updated: new Date() }
        }
      );
      return assortmentLinkId;
    }
  );
  return Collections.AssortmentLinks.find({
    _id: { $in: changedAssortmentLinkIds }
  }).fetch();
};

Products.helpers({
  assortmentIds() {
    return Collections.AssortmentProducts.find(
      { productId: this._id },
      { fields: { assortmentId: true } }
    )
      .fetch()
      .map(({ assortmentId: id }) => id);
  },
  assortments({ includeInactive, limit, offset } = {}) {
    const assortmentIds = this.assortmentIds();
    const selector = { _id: { $in: assortmentIds } };
    if (!includeInactive) {
      selector.isActive = true;
    }
    const options = { skip: offset, limit };
    return Collections.Assortments.find(selector, options).fetch();
  },
  siblings({ assortmentId, limit, offset, sort = {} } = {}) {
    const assortmentIds = assortmentId ? [assortmentId] : this.assortmentIds();
    if (!assortmentIds.length) return [];
    const productIds = Collections.AssortmentProducts.find({
      $and: [
        {
          productId: { $ne: this._id }
        },
        {
          assortmentId: { $in: assortmentIds }
        }
      ]
    })
      .fetch()
      .map(({ productId: curProductId }) => curProductId);

    const productSelector = {
      _id: { $in: productIds },
      status: { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] }
    };
    const productOptions = { skip: offset, limit, sort };
    return Products.find(productSelector, productOptions).fetch();
  }
});

Collections.Assortments.helpers({
  country() {
    return Countries.findOne({ isoCode: this.countryCode });
  },
  upsertLocalizedText({ locale, title, slug: propablyUsedSlug, ...rest }) {
    const slug = Collections.AssortmentTexts.getUnusedSlug(
      propablyUsedSlug || title || this._id,
      {
        assortmentId: { $ne: this._id }
      },
      !!propablyUsedSlug
    );

    Collections.AssortmentTexts.upsert(
      {
        assortmentId: this._id,
        locale
      },
      {
        $set: {
          title,
          locale,
          slug,
          ...rest,
          updated: new Date()
        }
      },
      { bypassCollection2: true }
    );

    Collections.Assortments.update(
      {
        _id: this._id
      },
      {
        $set: {
          updated: new Date()
        },
        $addToSet: {
          slugs: slug
        }
      }
    );
    return Collections.AssortmentTexts.findOne({
      assortmentId: this._id,
      locale
    });
  },
  getLocalizedTexts(locale) {
    const parsedLocale = new Locale(locale);
    return Collections.Assortments.getLocalizedTexts(this._id, parsedLocale);
  },
  addProduct({ productId }, { skipInvalidation = false } = {}) {
    const sortKey = Collections.AssortmentProducts.getNewSortKey(this._id);
    Collections.AssortmentProducts.remove({
      assortmentId: this._id,
      productId
    });
    const assortmentProductId = Collections.AssortmentProducts.insert({
      assortmentId: this._id,
      productId,
      sortKey,
      created: new Date()
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
      childAssortmentId: assortmentId
    });
    const assortmentProductId = Collections.AssortmentLinks.insert({
      parentAssortmentId: this._id,
      childAssortmentId: assortmentId,
      sortKey,
      created: new Date()
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
      filterId
    });
    const assortmentFilterId = Collections.AssortmentFilters.insert({
      assortmentId: this._id,
      filterId,
      sortKey,
      created: new Date()
    });
    return Collections.AssortmentFilters.findOne({ _id: assortmentFilterId });
  },
  productAssignments() {
    return Collections.AssortmentProducts.find(
      { assortmentId: this._id },
      {
        sort: { sortKey: 1 }
      }
    ).fetch();
  },
  filterAssignments() {
    return Collections.AssortmentFilters.find(
      { assortmentId: this._id },
      {
        sort: { sortKey: 1 }
      }
    ).fetch();
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
    includeInactive = false
  } = {}) {
    const productIds = this.productIds({ forceLiveCollection });
    const filterIds = Collections.AssortmentFilters.find(
      { assortmentId: this._id },
      {
        sort: { sortKey: 1 }
      }
    )
      .fetch()
      .map(({ filterId }) => filterId);
    return Filters.filterFilters({
      filterIds,
      productIds,
      query,
      forceLiveCollection,
      includeInactive
    });
  },
  products({
    limit,
    offset,
    query,
    sort = {},
    forceLiveCollection = false,
    includeInactive = false
  } = {}) {
    const productIds = this.productIds({ forceLiveCollection });
    const selector = {
      status: { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] }
    };
    if (!includeInactive) {
      selector.status = ProductStatus.ACTIVE;
    }
    const options = { skip: offset, limit, sort };

    const filteredProductIds = Filters.filterProductIds({
      productIds,
      query,
      forceLiveCollection
    });

    const filteredSelector = {
      ...selector,
      _id: { $in: filteredProductIds }
    };

    const unfilteredSelector = {
      ...selector,
      _id: { $in: productIds }
    };

    const filteredPipeline = [
      {
        $match: selector
      },
      {
        $addFields: {
          index: { $indexOfArray: [filteredProductIds, '$_id'] }
        }
      },
      {
        $match: {
          index: { $ne: -1 }
        }
      },
      {
        $sort: {
          index: 1
        }
      },
      { $skip: offset },
      { $limit: limit }
    ];

    const rawProducts = Products.rawCollection();
    const aggregateProducts = Meteor.wrapAsync(
      rawProducts.aggregate,
      rawProducts
    );

    return {
      totalCount: () => Products.find(unfilteredSelector, options).count(),
      filteredCount() {
        return Products.find(filteredSelector, options).count();
      },
      async items() {
        const aggregationPointer = aggregateProducts(filteredPipeline);
        const items = await aggregationPointer.toArray();
        return items.map(item => new Products._transform(item)); // eslint-disable-line
      }
    };
  },
  linkedAssortments() {
    return Collections.AssortmentLinks.find(
      {
        $or: [{ parentAssortmentId: this._id }, { childAssortmentId: this._id }]
      },
      {
        sort: { sortKey: 1 }
      }
    ).fetch();
  },
  children({ includeInactive = false } = {}) {
    const assortmentIds = Collections.AssortmentLinks.find(
      { parentAssortmentId: this._id },
      {
        fields: { childAssortmentId: 1 },
        sort: { sortKey: 1 }
      }
    )
      .fetch()
      .map(({ childAssortmentId }) => childAssortmentId);

    const selector = { _id: { $in: assortmentIds } };
    if (!includeInactive) {
      selector.isActive = true;
    }
    return Collections.Assortments.find(selector).fetch();
  },
  parents({ includeInactive = false } = {}) {
    const assortmentIds = Collections.AssortmentLinks.find(
      { childAssortmentId: this._id },
      {
        fields: { parentAssortmentId: 1 },
        sort: { sortKey: 1 }
      }
    )
      .fetch()
      .map(({ parentAssortmentId }) => parentAssortmentId);

    const selector = { _id: { $in: assortmentIds } };
    if (!includeInactive) {
      selector.isActive = true;
    }
    return Collections.Assortments.find(selector).fetch();
  },
  collectProductIdCache(ownProductIdCache, linkedAssortmentsCache) {
    const ownProductIds =
      ownProductIdCache ||
      this.productAssignments().map(({ productId }) => productId);

    const linkedAssortments =
      linkedAssortmentsCache || this.linkedAssortments();

    const childAssortments = linkedAssortments.filter(
      ({ parentAssortmentId }) => parentAssortmentId === this._id
    );

    const productIds = childAssortments.reduce(
      (accumulator, childAssortment) => {
        const assortment = childAssortment.child();
        if (assortment) {
          return accumulator.concat(assortment.collectProductIdCache());
        }
        return accumulator;
      },
      []
    );

    return [...ownProductIds, ...productIds];
  },
  invalidateProductIdCache() {
    const ownProductIds = this.productAssignments().map(
      ({ productId }) => productId
    );
    const linkedAssortments = this.linkedAssortments();
    const childProductIds = this.collectProductIdCache(
      ownProductIds,
      linkedAssortments
    );

    const productIds = [...new Set([...ownProductIds, ...childProductIds])];

    if (eqSet(new Set(productIds), new Set(this._cachedProductIds))) { // eslint-disable-line
      return 0;
    }
    let updateCount = Collections.Assortments.update(
      { _id: this._id },
      {
        $set: {
          updated: new Date(),
          _cachedProductIds: productIds
        }
      }
    );

    linkedAssortments
      .filter(({ childAssortmentId }) => childAssortmentId === this._id)
      .forEach(assortmentLink => {
        const parent = assortmentLink.parent();
        if (parent) updateCount += parent.invalidateProductIdCache();
      });

    return updateCount;
  }
});

Collections.AssortmentLinks.helpers({
  child() {
    return Collections.Assortments.findOne({ _id: this.childAssortmentId });
  },
  parent() {
    return Collections.Assortments.findOne({ _id: this.parentAssortmentId });
  }
});

Collections.AssortmentProducts.helpers({
  assortment() {
    return Collections.Assortments.findOne({ _id: this.assortmentId });
  },
  product() {
    return Products.findOne({ _id: this.productId });
  }
});

Collections.AssortmentFilters.helpers({
  assortment() {
    return Collections.Assortments.findOne({ _id: this.assortmentId });
  },
  filter() {
    return Filters.findOne({ _id: this.filterId });
  }
});
