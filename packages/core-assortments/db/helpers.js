import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { Countries } from 'meteor/unchained:core-countries';
import { Products, ProductStatus } from 'meteor/unchained:core-products';
import { findUnusedSlug, findPreservingIds } from 'meteor/unchained:utils';
import { Filters } from 'meteor/unchained:core-filters';
import { findLocalizedText } from 'meteor/unchained:core';
import { Locale } from 'locale';
import * as R from 'ramda';
import { makeBreadcrumbsBuilder } from '../breadcrumbs';
import * as Collections from './collections';

const eqSet = (as, bs) => {
  return [...as].join(',') === [...bs].join(',');
};

const fillUp = (arr, size) =>
  [...arr, ...new Array(size).fill(null)].slice(0, size);

const fillToSameLengthArray = (a, b) => {
  const length = Math.max(a.length, b.length);
  return [fillUp(a, length), fillUp(b, length)];
};

const divideTreeByLevels = (array, level = 0) => {
  const currentLevel = array.reduce((acc, item) => {
    if (typeof item === 'string') {
      return [...acc, item];
    }
    return acc;
  }, []);

  const nextLevels = array.reduce((acc, item) => {
    if (typeof item !== 'string') {
      return [...acc, ...divideTreeByLevels(item, level + 1)];
    }
    return acc;
  }, []);

  return [
    currentLevel.length && { level, items: currentLevel },
    ...nextLevels
  ].filter(Boolean);
};

const concatItemsByLevels = levelArray => {
  return Object.values(
    levelArray.reduce((acc, { level, items }) => {
      return {
        ...acc,
        [level]: [...(acc[level] || []), items]
      };
    }, {})
  );
};

const shuffleEachLevel = unshuffledLevels => {
  return unshuffledLevels.map(subArrays => {
    const shuffled = subArrays.reduce((a, b) => {
      const [accumulator, currentArray] = fillToSameLengthArray(a, b);
      return R.zip(accumulator, currentArray);
    }, []);
    return shuffled;
  });
};

const zipTreeByDeepness = tree => {
  const levels = divideTreeByLevels(tree);
  const concattedLevels = concatItemsByLevels(levels);
  const items = shuffleEachLevel(concattedLevels);

  return R.pipe(
    R.flatten,
    R.filter(Boolean)
  )(items);
};

export const resolveAssortmentLinkFromDatabase = ({
  locale,
  selector = {}
} = {}) => (assortmentId, childAssortmentId) => {
  const assortment = Collections.Assortments.findOne({
    _id: assortmentId,
    ...selector
  });
  return (
    assortment && {
      assortmentId,
      childAssortmentId,
      assortmentSlug: assortment.getLocalizedTexts(locale).slug,
      parentIds: assortment.parentIds()
    }
  );
};

export const resolveAssortmentProductsFromDatabase = ({
  selector = {}
} = {}) => productId => {
  return Collections.AssortmentProducts.find(
    { productId, ...selector },
    { fields: { _id: true, assortmentId: true } }
  ).fetch();
};

export const makeAssortmentBreadcrumbsBuilder = ({
  locale,
  resolveAssortmentProducts,
  resolveAssortmentLink
}) => {
  return makeBreadcrumbsBuilder({
    resolveAssortmentProducts:
      resolveAssortmentProducts || resolveAssortmentProductsFromDatabase(),
    resolveAssortmentLink:
      resolveAssortmentLink || resolveAssortmentLinkFromDatabase({ locale })
  });
};

Collections.Assortments.createAssortment = ({
  locale,
  title,
  isBase = false,
  isActive = true,
  isRoot = false,
  meta = {},
  ...rest
}) => {
  const assortment = {
    created: new Date(),
    sequence: Collections.Assortments.getNewSequence(),
    isBase,
    isActive,
    isRoot,
    meta,
    ...rest
  };
  const assortmentId = Collections.Assortments.insert(assortment);
  const assortmentObject = Collections.Assortments.findOne({
    _id: assortmentId
  });
  assortmentObject.upsertLocalizedText(locale, { title });
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
  // DEPRECATED
  assortments({ includeInactive, limit, offset } = {}) {
    const assortmentIds = this.assortmentIds();
    const selector = { _id: { $in: assortmentIds } };
    if (!includeInactive) {
      selector.isActive = true;
    }
    const options = { skip: offset, limit };
    return Collections.Assortments.find(selector, options).fetch();
  },
  assortmentPaths({ locale } = {}) {
    const build = makeAssortmentBreadcrumbsBuilder({ locale });
    return Promise.await(
      build({
        productId: this._id
      })
    );
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
  upsertLocalizedText(locale, { slug: forcedSlug, title, ...fields }) {
    const slug = Collections.AssortmentTexts.makeSlug({
      slug: forcedSlug,
      title,
      assortmentId: this._id
    });
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
          ...fields,
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
  addProduct({ productId, ...rest }, { skipInvalidation = false } = {}) {
    const sortKey = Collections.AssortmentProducts.getNewSortKey(this._id);
    Collections.AssortmentProducts.remove({
      assortmentId: this._id,
      productId
    });
    const assortmentProductId = Collections.AssortmentProducts.insert({
      assortmentId: this._id,
      productId,
      sortKey,
      created: new Date(),
      ...rest
    });
    if (!skipInvalidation) {
      this.invalidateProductIdCache();
    }
    return Collections.AssortmentProducts.findOne({ _id: assortmentProductId });
  },
  addLink({ assortmentId, ...rest }, { skipInvalidation = false } = {}) {
    const sortKey = Collections.AssortmentLinks.getNewSortKey(this._id);
    Collections.AssortmentLinks.remove({
      parentAssortmentId: this._id,
      childAssortmentId: assortmentId
    });
    const assortmentProductId = Collections.AssortmentLinks.insert({
      parentAssortmentId: this._id,
      childAssortmentId: assortmentId,
      sortKey,
      created: new Date(),
      ...rest
    });
    if (!skipInvalidation) {
      this.invalidateProductIdCache();
    }
    return Collections.AssortmentLinks.findOne({ _id: assortmentProductId });
  },
  addFilter({ filterId, ...rest }) {
    const sortKey = Collections.AssortmentFilters.getNewSortKey(this._id);
    Collections.AssortmentFilters.remove({
      assortmentId: this._id,
      filterId
    });
    const assortmentFilterId = Collections.AssortmentFilters.insert({
      assortmentId: this._id,
      filterId,
      sortKey,
      created: new Date(),
      ...rest
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
  productIds({
    forceLiveCollection = false,
    zipperFunction = zipTreeByDeepness
  } = {}) {
    if (!this._cachedProductIds || forceLiveCollection) {  // eslint-disable-line
      const collectedProductIdTree = this.collectProductIdCacheTree() || [];
      return [...new Set(zipperFunction(collectedProductIdTree))];
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
    forceLiveCollection = true,
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

    return {
      totalCount: () => Products.find(unfilteredSelector, options).count(),
      filteredCount() {
        return Products.find(filteredSelector, options).count();
      },
      async items() {
        return findPreservingIds(Products)(selector, filteredProductIds, {
          offset,
          limit
        });
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
  async children({ includeInactive = false } = {}) {
    const assortmentIds = Collections.AssortmentLinks.find(
      { parentAssortmentId: this._id },
      {
        fields: { childAssortmentId: 1 },
        sort: { sortKey: 1 }
      }
    )
      .fetch()
      .map(({ childAssortmentId }) => childAssortmentId);

    const selector = !includeInactive ? { isActive: true } : {};
    return findPreservingIds(Collections.Assortments)(selector, assortmentIds);
  },
  parentIds() {
    return Collections.AssortmentLinks.find(
      {
        childAssortmentId: this._id
      },
      {
        fields: { parentAssortmentId: 1 },
        sort: { sortKey: 1 }
      }
    )
      .fetch()
      .map(({ parentAssortmentId }) => parentAssortmentId)
      .filter(Boolean);
  },
  async parents({ includeInactive = false } = {}) {
    const selector = !includeInactive ? { isActive: true } : {};
    return findPreservingIds(Collections.Assortments)(
      selector,
      this.parentIds()
    );
  },
  collectProductIdCacheTree() {
    const ownProductIds = this.productAssignments().map(
      ({ productId }) => productId
    );
    const linkedAssortments = this.linkedAssortments();

    const childAssortments = linkedAssortments.filter(
      ({ parentAssortmentId }) => parentAssortmentId === this._id
    );

    const productIds = childAssortments.map(childAssortment => {
      const assortment = childAssortment.child();
      if (assortment) {
        return assortment.collectProductIdCacheTree();
      }
      return [];
    });

    return [...ownProductIds, ...productIds];
  },
  invalidateProductIdCache() {
    const linkedAssortments = this.linkedAssortments();
    const productIds = this.productIds({ forceLiveCollection: true });

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
  },
  assortmentPaths({ locale } = {}) {
    const build = makeAssortmentBreadcrumbsBuilder({ locale });
    return Promise.await(
      build({
        assortmentId: this._id
      })
    );
  }
});

Collections.AssortmentTexts.makeSlug = (
  { slug, title, assortmentId },
  options
) => {
  return findUnusedSlug(Collections.AssortmentTexts, options)(
    {
      existingSlug: slug,
      title: title || assortmentId
    },
    {
      assortmentId: { $ne: assortmentId }
    }
  );
};

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
