import 'meteor/dburles:collection-helpers';
import { Countries } from 'meteor/unchained:core-countries';
import {
  findUnusedSlug,
  findPreservingIds,
  findLocalizedText,
} from 'meteor/unchained:utils';
import { emit } from 'meteor/unchained:core-events';

import { Locale } from 'locale';
import { log } from 'meteor/unchained:core-logger';
import { makeBreadcrumbsBuilder } from '../../breadcrumbs';
import * as Collections from './collections';
import settings from '../../settings';
import { AssortmentDocuments, AssortmentMedia } from '../assortment-media';

const eqSet = (as, bs) => {
  return [...as].join(',') === [...bs].join(',');
};

const buildFindSelector = ({
  slugs = [],
  tags = [],
  includeLeaves = false,
  includeInactive = false,
}) => {
  const selector = {};

  if (slugs?.length > 0) {
    selector.slugs = { $in: slugs };
  } else if (tags?.length > 0) {
    selector.tags = { $all: tags };
  }

  if (!includeLeaves) {
    selector.isRoot = true;
  }
  if (!includeInactive) {
    selector.isActive = true;
  }
  return selector;
};

export const resolveAssortmentLinksFromDatabase =
  ({ selector = {} } = {}) =>
  (assortmentId, childAssortmentId) => {
    const assortmentLinks = Collections.AssortmentLinks.find(
      { childAssortmentId: assortmentId, ...selector },
      {
        fields: { parentAssortmentId: 1 },
        sort: { sortKey: 1 },
      }
    ).fetch();
    const parentIds = assortmentLinks.map((link) => link.parentAssortmentId);
    return {
      assortmentId,
      childAssortmentId,
      parentIds,
    };
  };

export const resolveAssortmentProductsFromDatabase =
  ({ selector = {} } = {}) =>
  (productId) => {
    return Collections.AssortmentProducts.find(
      { productId, ...selector },
      {
        fields: { _id: true, assortmentId: true },
        sort: { sortKey: 1 },
      }
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
      resolveAssortmentLink || resolveAssortmentLinksFromDatabase(),
  });
};

Collections.Assortments.assortmentExists = ({ assortmentId, slug }) => {
  const selector = assortmentId ? { _id: assortmentId } : { slugs: slug };
  return !!Collections.Assortments.find(selector, { limit: 1 }).count();
};

Collections.Assortments.findAssortment = ({ assortmentId, slug, ...rest }) => {
  let selector = {};

  if (assortmentId) {
    selector._id = assortmentId;
  } else if (slug) {
    selector.slugs = slug;
  } else {
    selector = rest;
  }
  return Collections.Assortments.findOne(selector);
};

Collections.Assortments.findAssortments = ({
  sort = { sequence: 1 },
  ...query
}) => {
  const options = { sort };

  return Collections.Assortments.find(
    buildFindSelector(query),
    options
  ).fetch();
};

Collections.Assortments.count = async (query) => {
  const count = await Collections.Assortments.rawCollection().countDocuments(
    buildFindSelector(query)
  );
  return count;
};

Collections.Assortments.updateAssortment = ({
  assortmentId,
  ...assortment
}) => {
  const result = Collections.Assortments.update(
    { _id: assortmentId },
    {
      $set: {
        ...assortment,
        updated: new Date(),
      },
    }
  );
  emit('ASSORTMENT_UPDATE', { assortmentId });
  return result;
};

Collections.Assortments.removeAssortment = (
  { assortmentId },
  { skipInvalidation = false } = {}
) => {
  Collections.AssortmentLinks.removeLinks(
    {
      $or: [
        { parentAssortmentId: assortmentId },
        { childAssortmentId: assortmentId },
      ],
    },
    { skipInvalidation: true }
  );
  Collections.AssortmentProducts.removeProducts(
    { assortmentId },
    { skipInvalidation: true }
  );
  Collections.AssortmentFilters.removeFilters(
    { assortmentId },
    { skipInvalidation: true }
  );
  Collections.AssortmentTexts.remove({ assortmentId });
  Collections.Assortments.remove({ _id: assortmentId });
  if (!skipInvalidation) {
    // Invalidate all assortments
    Collections.Assortments.invalidateCache();
  }
  emit('ASSORTMENT_REMOVE', { assortmentId });
};

Collections.Assortments.invalidateCache = (selector) => {
  log('Assortments: Start invalidating assortment caches', {
    level: 'verbose',
  });
  const assortments = Collections.Assortments.find(selector || {}).fetch();
  assortments.forEach((assortment) => {
    assortment.invalidateProductIdCache({ skipUpstreamTraversal: true });
  });
};

Collections.AssortmentLinks.findLink = ({
  assortmentLinkId,
  parentAssortmentId,
  childAssortmentId,
}) => {
  return Collections.AssortmentLinks.findOne(
    assortmentLinkId
      ? { _id: assortmentLinkId }
      : { parentAssortmentId, childAssortmentId }
  );
};

Collections.AssortmentLinks.removeLinks = (
  selector,
  { skipInvalidation = false } = {}
) => {
  const assortmentLinks = Collections.AssortmentLinks.find(selector, {
    fields: { _id: true },
  }).fetch();
  Collections.AssortmentLinks.remove(selector);
  assortmentLinks.forEach((assortmentLink) =>
    emit('ASSORTMENT_REMOVE_LINK', { assortmentLinkId: assortmentLink._id })
  );
  if (!skipInvalidation && assortmentLinks.length) {
    Collections.Assortments.invalidateCache({
      _id: {
        $in: assortmentLinks.map(
          (assortmentLink) => assortmentLink.parentAssortmentId
        ),
      },
    });
  }
  return assortmentLinks;
};

Collections.AssortmentLinks.removeLink = ({ assortmentLinkId }, options) => {
  return Collections.AssortmentLinks.removeLinks(
    { _id: assortmentLinkId },
    options
  );
};

Collections.AssortmentLinks.createAssortmentLink = (
  {
    parentAssortmentId,
    childAssortmentId,
    _id,
    sortKey: forceSortKey,
    ...rest
  },
  { skipInvalidation = false } = {}
) => {
  const selector = {
    parentAssortmentId,
    childAssortmentId,
    ...(_id ? { _id } : {}),
  };
  const $set = {
    updated: new Date(),
    ...rest,
  };
  const $setOnInsert = {
    created: new Date(),
  };
  if (!forceSortKey) {
    $setOnInsert.sortKey =
      Collections.AssortmentLinks.getNewSortKey(parentAssortmentId);
  } else {
    $set.sortKey = forceSortKey;
  }
  Collections.AssortmentLinks.upsert(selector, {
    $set,
    $setOnInsert,
  });
  const assortmentLink = Collections.AssortmentLinks.findOne(selector);
  if (!skipInvalidation) {
    Collections.Assortments.invalidateCache({ _id: parentAssortmentId });
  }
  emit('ASSORTMENT_ADD_LINK', {
    assortmentLink,
  });
  return assortmentLink;
};

Collections.AssortmentProducts.removeProducts = (
  selector,
  { skipInvalidation = false } = {}
) => {
  const assortmentProducts = Collections.AssortmentProducts.find(selector, {
    fields: { _id: true, assortmentId: true },
  }).fetch();
  Collections.AssortmentProducts.remove(selector);
  assortmentProducts.forEach((assortmentProduct) =>
    emit('ASSORTMENT_REMOVE_PRODUCT', {
      assortmentProductId: assortmentProduct._id,
    })
  );
  if (!skipInvalidation && assortmentProducts.length) {
    Collections.Assortments.invalidateCache({
      _id: {
        $in: assortmentProducts.map(
          (assortmentProduct) => assortmentProduct.assortmentId
        ),
      },
    });
  }
  return assortmentProducts;
};

Collections.AssortmentProducts.removeProduct = (
  { assortmentProductId },
  options
) => {
  return Collections.AssortmentProducts.removeProducts(
    { _id: assortmentProductId },
    options
  );
};

Collections.AssortmentProducts.createAssortmentProduct = (
  { productId, assortmentId, _id, sortKey: forceSortKey, ...rest },
  { skipInvalidation = false } = {}
) => {
  const selector = {
    productId,
    assortmentId,
    ...(_id ? { _id } : {}),
  };
  const $set = {
    updated: new Date(),
    ...rest,
  };
  const $setOnInsert = {
    created: new Date(),
  };
  if (!forceSortKey) {
    $setOnInsert.sortKey =
      Collections.AssortmentProducts.getNewSortKey(assortmentId);
  } else {
    $set.sortKey = forceSortKey;
  }
  Collections.AssortmentProducts.upsert(selector, {
    $set,
    $setOnInsert,
  });
  const assortmentProduct = Collections.AssortmentProducts.findOne(selector);
  if (!skipInvalidation) {
    Collections.Assortments.invalidateCache({ _id: assortmentId });
  }
  emit('ASSORTMENT_ADD_PRODUCT', { assortmentProduct });
  return assortmentProduct;
};

Collections.AssortmentFilters.createAssortmentFilter = ({
  assortmentId,
  filterId,
  _id,
  sortKey: forceSortKey,
  ...rest
}) => {
  const selector = {
    filterId,
    assortmentId,
    ...(_id ? { _id } : {}),
  };
  const $set = {
    updated: new Date(),
    ...rest,
  };
  const $setOnInsert = {
    created: new Date(),
  };
  if (!forceSortKey) {
    $setOnInsert.sortKey =
      Collections.AssortmentFilters.getNewSortKey(assortmentId);
  } else {
    $set.sortKey = forceSortKey;
  }
  Collections.AssortmentFilters.upsert(selector, {
    $set,
    $setOnInsert,
  });
  const assortmentFilter = Collections.AssortmentFilters.findOne(selector);
  emit('ASSORTMENT_ADD_FILTER', { assortmentFilter });
  return assortmentFilter;
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
  emit('ASSORTMENT_CREATE', { assortment: assortmentObject });
  return assortmentObject;
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
  emit('ASSORTMENT_REORDER_PRODUCTS', { assortmentProducts });
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
  const assortmentFilters = Collections.AssortmentFilters.find({
    _id: { $in: changedAssortmentFilterIds },
  }).fetch();

  emit('ASSORTMENT_REORDER_FILTERS', { assortmentFilters });
  return assortmentFilters;
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
  const assortmentLinks = Collections.AssortmentLinks.find({
    _id: { $in: changedAssortmentLinkIds },
  }).fetch();
  emit('ASSORTMENT_REORDER_LINKS', { assortmentLinks });
  return assortmentLinks;
};

Collections.Assortments.setBase = ({ assortmentId }) => {
  Collections.Assortments.update(
    { isBase: true },
    {
      $set: {
        isBase: false,
        updated: new Date(),
      },
    },
    { multi: true }
  );
  const result = Collections.Assortments.update(
    { _id: assortmentId },
    {
      $set: {
        isBase: true,
        updated: new Date(),
      },
    }
  );
  emit('ASSORTMENT_SET_BASE', { assortmentId });
  return result;
};

Collections.Assortments.helpers({
  updateTexts({ texts, userId }) {
    const assortmentTexts = texts?.map(({ locale, ...localizations }) =>
      this.upsertLocalizedText(locale, {
        ...localizations,
        authorId: userId,
      })
    );
    emit('ASSORTMENT_UPDATE_TEXTS', {
      assortmentId: this._id,
      assortmentTexts,
    });
    return assortmentTexts;
  },
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
  addMediaLink(mediaData) {
    return AssortmentMedia.createMedia({
      assortmentId: this._id,
      ...mediaData,
    });
  },
  addMedia({
    rawFile,
    href,
    name,
    authorId,
    meta,
    tags = [],
    sortKey,
    ...options
  }) {
    const fileLoader = rawFile
      ? AssortmentDocuments.insertWithRemoteFile({
          file: rawFile,
          userId: authorId,
        })
      : AssortmentDocuments.insertWithRemoteURL({
          url: href,
          fileName: name,
          userId: authorId,
          ...options,
        });
    const file = Promise.await(fileLoader);
    const assortmentMedia = this.addMediaLink({
      mediaId: file._id,
      tags,
      meta,
      authorId,
      sortKey,
    });
    emit('ASSORTMENT_ADD_MEDIA', { assortmentMedia });
    return assortmentMedia;
  },
  media({ limit, offset, tags }) {
    const selector = { assortmentId: this._id };
    if (tags && tags.length > 0) {
      selector.tags = { $all: tags };
    }
    return AssortmentMedia.find(selector, {
      skip: offset,
      limit,
      sort: { sortKey: 1 },
    }).fetch();
  },
  getLocalizedTexts(locale) {
    const parsedLocale = new Locale(locale);
    return Collections.Assortments.getLocalizedTexts(this._id, parsedLocale);
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

Collections.AssortmentTexts.findAssortmentTexts = ({ assortmentId }) => {
  return Collections.AssortmentTexts.find({ assortmentId }).fetch();
};

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

Collections.AssortmentProducts.findProduct = ({ assortmentProductId }) => {
  return Collections.AssortmentProducts.findOne({ _id: assortmentProductId });
};

Collections.AssortmentProducts.helpers({
  assortment() {
    return Collections.Assortments.findOne({ _id: this.assortmentId });
  },
});

Collections.AssortmentFilters.findFilter = ({ assortmentFilterId }) => {
  return Collections.AssortmentFilters.findOne({ _id: assortmentFilterId });
};

Collections.AssortmentFilters.removeFilters = (selector) => {
  const ids = Collections.AssortmentFilters.find(selector, {
    fields: { _id: true },
  })
    .fetch()
    .map((af) => af._id);
  Collections.AssortmentFilters.remove(selector);
  ids.forEach((assortmentFilterId) => {
    emit('ASSORTMENT_REMOVE_FILTER', { assortmentFilterId });
  });
  return ids;
};

Collections.AssortmentFilters.removeFilter = (
  { assortmentFilterId },
  options
) => {
  return Collections.AssortmentFilters.removeFilters(
    {
      _id: assortmentFilterId,
    },
    options
  );
};

Collections.AssortmentFilters.helpers({
  assortment() {
    return Collections.Assortments.findOne({ _id: this.assortmentId });
  },
});
