import 'meteor/dburles:collection-helpers';
import { Countries } from 'meteor/unchained:core-countries';
import { Products, ProductStatus } from 'meteor/unchained:core-products';
import { findUnusedSlug, findPreservingIds } from 'meteor/unchained:utils';
import { searchProducts, Filters } from 'meteor/unchained:core-filters';
import { findLocalizedText } from 'meteor/unchained:core';
import { Locale } from 'locale';
import { log } from 'meteor/unchained:core-logger';
import { makeBreadcrumbsBuilder } from '../breadcrumbs';
import * as Collections from './collections';
import settings from '../settings';

const eqSet = (as, bs) => {
  return [...as].join(',') === [...bs].join(',');
};

export const resolveAssortmentLinkFromDatabase = ({ selector = {} } = {}) => (
  assortmentId,
  childAssortmentId
) => {
  const assortment = Collections.Assortments.findOne({
    _id: assortmentId,
    ...selector,
  });
  return (
    assortment && {
      assortmentId,
      childAssortmentId,
      parentIds: assortment.parentIds(),
    }
  );
};

export const resolveAssortmentProductsFromDatabase = ({
  selector = {},
} = {}) => (productId) => {
  return Collections.AssortmentProducts.find(
    { productId, ...selector },
    { fields: { _id: true, assortmentId: true } }
  ).fetch();
};

export const makeAssortmentBreadcrumbsBuilder = ({
  resolveAssortmentProducts,
  resolveAssortmentLink,
} = {}) => {
  return makeBreadcrumbsBuilder({
    resolveAssortmentProducts:
      resolveAssortmentProducts || resolveAssortmentProductsFromDatabase(),
    resolveAssortmentLink:
      resolveAssortmentLink || resolveAssortmentLinkFromDatabase(),
  });
};

Collections.AssortmentLinks.createAssortmentLink = ({
  parentAssortmentId,
  childAssortmentId,
  ...rest
}) => {
  const sortKey = Collections.AssortmentLinks.getNewSortKey(parentAssortmentId);
  const assortmentProductId = Collections.AssortmentLinks.insert({
    parentAssortmentId,
    childAssortmentId,
    sortKey,
    created: new Date(),
    ...rest,
  });
  return Collections.AssortmentLinks.findOne({ _id: assortmentProductId });
};

Collections.AssortmentProducts.createAssortmentProduct = ({
  productId,
  assortmentId,
  ...rest
}) => {
  const sortKey = Collections.AssortmentProducts.getNewSortKey(assortmentId);
  const assortmentProductId = Collections.AssortmentProducts.insert({
    assortmentId: this._id,
    productId,
    sortKey,
    created: new Date(),
    ...rest,
  });
  return Collections.AssortmentProducts.findOne({ _id: assortmentProductId });
};

Collections.AssortmentFilters.createAssortmentFilter = ({
  assortmentId,
  filterId,
  ...rest
}) => {
  const sortKey = Collections.AssortmentFilters.getNewSortKey(this._id);
  const assortmentFilterId = Collections.AssortmentFilters.insert({
    assortmentId,
    filterId,
    sortKey,
    created: new Date(),
    ...rest,
  });
  return Collections.AssortmentFilters.findOne({ _id: assortmentFilterId });
};

Collections.Assortments.createAssortment = ({
  locale,
  title,
  isBase = false,
  isActive = true,
  isRoot = false,
  meta = {},
  sequence,
  authorId,
  ...rest
}) => {
  const assortmentId = Collections.Assortments.insert({
    created: new Date(),
    sequence: sequence ?? Collections.Assortments.find({}).count() + 10,
    isBase,
    isActive,
    isRoot,
    meta,
    authorId,
    ...rest,
  });
  const assortmentObject = Collections.Assortments.findOne({
    _id: assortmentId,
  });
  if (locale) {
    assortmentObject.upsertLocalizedText(locale, { title, authorId });
  }
  return assortmentObject;
};

Collections.Assortments.sync = (syncFn) => {
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
  log(
    `Assortment Sync: Marked Assortment tree dirty at timestamp ${timestamp}`,
    {
      updatedAssortmentCount,
      updatedAssortmentTextsCount,
      updatedAssortmentProductsCount,
      updatedAssortmentLinksCount,
      updatedAssortmentFiltersCount,
      level: 'verbose',
    }
  );
  return new Date();
};

Collections.Assortments.cleanDirtyAssortmentTreeByReferenceDate = (
  referenceDate
) => {
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
  log(
    `Assortment Sync: Result of assortment cleaning with referenceDate=${referenceDate}`,
    {
      updatedAssortmentCount,
      updatedAssortmentTextsCount,
      updatedAssortmentProductsCount,
      updatedAssortmentLinksCount,
      updatedAssortmentFiltersCount,
      level: 'verbose',
    }
  );
};

Collections.Assortments.updateCleanAssortmentActivation = () => {
  const disabledDirtyAssortmentsCount = Collections.Assortments.update(
    {
      isActive: true,
      dirty: true,
    },
    {
      $set: { isActive: false },
    },
    { bypassCollection2: true, multi: true }
  );
  const enabledCleanAssortmentsCount = Collections.Assortments.update(
    {
      isActive: false,
      dirty: { $ne: true },
    },
    {
      $set: { isActive: true },
    },
    { bypassCollection2: true, multi: true }
  );

  log(`Assortment Sync: Result of assortment activation`, {
    disabledDirtyAssortmentsCount,
    enabledCleanAssortmentsCount,
    level: 'verbose',
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

  log(`result of assortment purging with onlyDirty=${onlyDirty}`, {
    removedAssortmentCount,
    removedAssortmentTextCount,
    removedAssortmentProductsCount,
    removedAssortmentLinksCount,
    removedAssortmentFiltersCount,
    level: 'verbose',
  });
};

Collections.Assortments.getLocalizedTexts = (assortmentId, locale) =>
  findLocalizedText(Collections.AssortmentTexts, { assortmentId }, locale);

Collections.AssortmentProducts.getNewSortKey = (assortmentId) => {
  const lastAssortmentProduct = Collections.AssortmentProducts.findOne(
    {
      assortmentId,
    },
    {
      sort: { sortKey: -1 },
    }
  ) || { sortKey: 0 };
  return lastAssortmentProduct.sortKey + 1;
};

Collections.AssortmentProducts.updateManualOrder = ({
  sortKeys,
  skipInvalidation = false,
}) => {
  const changedAssortmentProductIds = sortKeys.map(
    ({ assortmentProductId, sortKey }) => {
      Collections.AssortmentProducts.update(
        {
          _id: assortmentProductId,
        },
        {
          $set: { sortKey: sortKey + 1, updated: new Date() },
        }
      );
      return assortmentProductId;
    }
  );
  const assortmentProducts = Collections.AssortmentProducts.find({
    _id: { $in: changedAssortmentProductIds },
  }).fetch();

  if (!skipInvalidation) {
    const assortmentIds = assortmentProducts.map(
      ({ assortmentId }) => assortmentId
    );
    Collections.Assortments.find({
      _id: { $in: assortmentIds },
    }).forEach((assortment) => assortment.invalidateProductIdCache());
  }

  return assortmentProducts;
};

Collections.AssortmentFilters.getNewSortKey = (assortmentId) => {
  const lastAssortmentFilter = Collections.AssortmentFilters.findOne(
    {
      assortmentId,
    },
    {
      sort: { sortKey: -1 },
    }
  ) || { sortKey: 0 };
  return lastAssortmentFilter.sortKey + 1;
};

Collections.AssortmentFilters.updateManualOrder = ({ sortKeys }) => {
  const changedAssortmentFilterIds = sortKeys.map(
    ({ assortmentFilterId, sortKey }) => {
      Collections.AssortmentFilters.update(
        {
          _id: assortmentFilterId,
        },
        {
          $set: { sortKey: sortKey + 1, updated: new Date() },
        }
      );
      return assortmentFilterId;
    }
  );
  return Collections.AssortmentFilters.find({
    _id: { $in: changedAssortmentFilterIds },
  }).fetch();
};

Collections.AssortmentLinks.getNewSortKey = (parentAssortmentId) => {
  const lastAssortmentProduct = Collections.AssortmentLinks.findOne(
    {
      parentAssortmentId,
    },
    {
      sort: { sortKey: -1 },
    }
  ) || { sortKey: 0 };
  return lastAssortmentProduct.sortKey + 1;
};

Collections.AssortmentLinks.updateManualOrder = ({ sortKeys }) => {
  const changedAssortmentLinkIds = sortKeys.map(
    ({ assortmentLinkId, sortKey }) => {
      Collections.AssortmentLinks.update(
        {
          _id: assortmentLinkId,
        },
        {
          $set: { sortKey: sortKey + 1, updated: new Date() },
        }
      );
      return assortmentLinkId;
    }
  );
  return Collections.AssortmentLinks.find({
    _id: { $in: changedAssortmentLinkIds },
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
  async assortmentPaths() {
    const build = makeAssortmentBreadcrumbsBuilder();
    return build({
      productId: this._id,
    });
  },
  siblings({
    assortmentId,
    limit,
    offset,
    sort = {},
    includeInactive = false,
  } = {}) {
    const assortmentIds = assortmentId ? [assortmentId] : this.assortmentIds();
    if (!assortmentIds.length) return [];
    const productIds = Collections.AssortmentProducts.find({
      $and: [
        {
          productId: { $ne: this._id },
        },
        {
          assortmentId: { $in: assortmentIds },
        },
      ],
    })
      .fetch()
      .map(({ productId: curProductId }) => curProductId);

    const productSelector = {
      _id: { $in: productIds },
      status: includeInactive
        ? { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] }
        : ProductStatus.ACTIVE,
    };
    const productOptions = { skip: offset, limit, sort };
    return Products.find(productSelector, productOptions).fetch();
  },
});

Collections.Assortments.helpers({
  country() {
    return Countries.findOne({ isoCode: this.countryCode });
  },
  upsertLocalizedText(locale, { slug: forcedSlug, title, ...fields }) {
    const slug = Collections.AssortmentTexts.makeSlug({
      slug: forcedSlug,
      title,
      assortmentId: this._id,
    });
    const modifier = {
      $set: {
        updated: new Date(),
        title,
        ...fields,
      },
      $setOnInsert: {
        created: new Date(),
        assortmentId: this._id,
        locale,
      },
    };
    if (forcedSlug) {
      modifier.$set.slug = slug;
    } else {
      modifier.$setOnInsert.slug = slug;
    }
    const { insertedId, numberAffected } = Collections.AssortmentTexts.upsert(
      {
        assortmentId: this._id,
        locale,
      },
      modifier
    );

    if (insertedId || numberAffected) {
      Collections.Assortments.update(
        {
          _id: this._id,
        },
        {
          $set: {
            updated: new Date(),
          },
          $addToSet: {
            slugs: slug,
          },
        }
      );
      Collections.Assortments.update(
        {
          _id: { $ne: this._id },
          slugs: slug,
        },
        {
          $set: {
            updated: new Date(),
          },
          $pullAll: {
            slugs: slug,
          },
        },
        { multi: true }
      );
    }
    return Collections.AssortmentTexts.findOne(
      insertedId
        ? { _id: insertedId }
        : {
            assortmentId: this._id,
            locale,
          }
    );
  },
  getLocalizedTexts(locale) {
    const parsedLocale = new Locale(locale);
    return Collections.Assortments.getLocalizedTexts(this._id, parsedLocale);
  },
  addProduct({ productId, ...rest }, { skipInvalidation = false } = {}) {
    Collections.AssortmentProducts.remove({
      assortmentId: this._id,
      productId,
    });
    const assortmentProduct = Collections.AssortmentProducts.createAssortmentProduct(
      {
        assortmentId: this._id,
        productId,
        ...rest,
      }
    );
    if (!skipInvalidation) {
      this.invalidateProductIdCache();
    }
    return assortmentProduct;
  },
  addLink({ assortmentId, ...rest }, { skipInvalidation = false } = {}) {
    Collections.AssortmentLinks.remove({
      parentAssortmentId: this._id,
      childAssortmentId: assortmentId,
    });
    const assortmentLink = Collections.AssortmentLinks.createAssortmentLink({
      parentAssortmentId: this._id,
      childAssortmentId: assortmentId,
      ...rest,
    });
    if (!skipInvalidation) {
      this.invalidateProductIdCache();
    }
    return assortmentLink;
  },
  addFilter({ filterId, ...rest }) {
    Collections.AssortmentFilters.remove({
      assortmentId: this._id,
      filterId,
    });
    return Collections.AssortmentFilters.createAssortmentFilter({
      assortmentId: this._id,
      filterId,
      ...rest,
    });
  },
  productAssignments() {
    return Collections.AssortmentProducts.find(
      { assortmentId: this._id },
      {
        sort: { sortKey: 1 },
      }
    ).fetch();
  },
  filterAssignments() {
    return Collections.AssortmentFilters.find(
      { assortmentId: this._id },
      {
        sort: { sortKey: 1 },
      }
    ).fetch();
  },
  productIds({
    forceLiveCollection = false,
    ignoreChildAssortments = false,
  } = {}) {
    if (ignoreChildAssortments) {
      return this.productAssignments().map(({ productId }) => productId);
    }
    // eslint-disable-next-line
    if (!this._cachedProductIds || forceLiveCollection) {
      // get array of assortment products and child assortment links to products
      const collectedProductIdTree = this.collectProductIdCacheTree() || [];
      return [...new Set(settings.zipTree(collectedProductIdTree))];
    }
    return this._cachedProductIds; // eslint-disable-line
  },
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
  linkedAssortments() {
    return Collections.AssortmentLinks.find(
      {
        $or: [
          { parentAssortmentId: this._id },
          { childAssortmentId: this._id },
        ],
      },
      {
        sort: { sortKey: 1 },
      }
    ).fetch();
  },
  async children({ includeInactive = false } = {}) {
    const assortmentIds = Collections.AssortmentLinks.find(
      { parentAssortmentId: this._id },
      {
        fields: { childAssortmentId: 1 },
        sort: { sortKey: 1 },
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
        childAssortmentId: this._id,
      },
      {
        fields: { parentAssortmentId: 1 },
        sort: { sortKey: 1 },
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
  // returns AssortmentProducts and child assortment links with products.
  collectProductIdCacheTree() {
    // get assortment products related with this assortment I.E AssortmentProducts
    const ownProductIds = this.productAssignments().map(
      ({ productId }) => productId
    );
    // get assortment links parent or child linked with this assortment I.E. AssortmentLinks
    const linkedAssortments = this.linkedAssortments();

    // filter previous result set to get child assortment links
    const childAssortments = linkedAssortments.filter(
      ({ parentAssortmentId }) => parentAssortmentId === this._id
    );

    // perform the whole function recursively for each child
    const productIds = childAssortments.map((childAssortment) => {
      const assortment = childAssortment.child();
      if (assortment) {
        return assortment.collectProductIdCacheTree();
      }
      return [];
    });

    return [...ownProductIds, ...productIds];
  },
  invalidateProductIdCache({ skipUpstreamTraversal = false } = {}) {
    const linkedAssortments = this.linkedAssortments();
    const productIds = this.productIds({ forceLiveCollection: true });

    // eslint-disable-next-line
    if (eqSet(new Set(productIds), new Set(this._cachedProductIds))) {
      return 0;
    }
    let updateCount = Collections.Assortments.update(
      { _id: this._id },
      {
        $set: {
          updated: new Date(),
          _cachedProductIds: productIds,
        },
      }
    );

    if (skipUpstreamTraversal) return updateCount;

    linkedAssortments
      .filter(({ childAssortmentId }) => childAssortmentId === this._id)
      .forEach((upstreamAssortmentLink) => {
        const parent = upstreamAssortmentLink.parent();
        if (parent) updateCount += parent.invalidateProductIdCache();
      });

    return updateCount;
  },
  async assortmentPaths() {
    const build = makeAssortmentBreadcrumbsBuilder();
    return build({
      assortmentId: this._id,
    });
  },
});

Collections.AssortmentTexts.makeSlug = (
  { slug, title, assortmentId },
  options
) => {
  const checkSlugIsUnique = (newPotentialSlug) => {
    return (
      Collections.AssortmentTexts.find({
        assortmentId: { $ne: assortmentId },
        slug: newPotentialSlug,
      }).count() === 0
    );
  };
  return findUnusedSlug(
    checkSlugIsUnique,
    options
  )({
    existingSlug: slug,
    title: title || assortmentId,
  });
};

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
