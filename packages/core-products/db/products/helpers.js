import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { ProductPricingDirector } from 'meteor/unchained:core-pricing';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { Countries } from 'meteor/unchained:core-countries';
import { emit } from 'meteor/unchained:core-events';
import {
  AssortmentProducts,
  makeAssortmentBreadcrumbsBuilder,
} from 'meteor/unchained:core-assortments';
import {
  findLocalizedText,
  objectInvert,
  findUnusedSlug,
} from 'meteor/unchained:utils';
import { Locale } from 'locale';
import crypto from 'crypto';
import { Products, ProductTexts } from './collections';

import { ProductVariations } from '../product-variations/collections';
import { ProductMedia, Media } from '../product-media/collections';
import { ProductReviews } from '../product-reviews/collections';
import { ProductStatus, ProductTypes } from './schema';

const getPriceLevels = (product, { currencyCode, countryCode }) => {
  return (product?.commerce?.pricing || [])
    .sort(
      (
        { maxQuantity: leftMaxQuantity = 0 },
        { maxQuantity: rightMaxQuantity = 0 }
      ) => {
        if (
          leftMaxQuantity === rightMaxQuantity ||
          (!leftMaxQuantity && !rightMaxQuantity)
        )
          return 0;
        if (leftMaxQuantity === 0) return 1;
        if (rightMaxQuantity === 0) return -1;
        return leftMaxQuantity - rightMaxQuantity;
      }
    )
    .filter(
      (priceLevel) =>
        priceLevel.currencyCode === currencyCode &&
        priceLevel.countryCode === countryCode
    );
};

const getPriceRange = (prices) => {
  const { min, max } = prices.reduce(
    (m, current) => {
      return {
        min: current.amount < m.min.amount ? current : m.min,
        max: current.amount > m.max.amount ? current : m.max,
      };
    },
    {
      min: { ...prices[0] },
      max: { ...prices[0] },
    }
  );

  return {
    minPrice: {
      _id: crypto
        .createHash('sha256')
        .update(
          [
            this._id,
            min?.isTaxable,
            min?.isNetPrice,
            min?.amount,
            min?.currencyCode,
          ].join('')
        )
        .digest('hex'),
      isTaxable: !!min?.isTaxable,
      isNetPrice: !!min?.isNetPrice,
      amount: Math.round(min?.amount),
      currencyCode: min?.currencyCode,
    },
    maxPrice: {
      _id: crypto
        .createHash('sha256')
        .update(
          [
            this._id,
            max?.isTaxable,
            max?.isNetPrice,
            max?.amount,
            max?.currencyCode,
          ].join('')
        )
        .digest('hex'),
      isTaxable: !!max?.isTaxable,
      isNetPrice: !!max?.isNetPrice,
      amount: Math.round(max?.amount),
      currencyCode: max?.currencyCode,
    },
  };
};

Products.productExists = ({ productId, slug }) => {
  const selector = productId ? { _id: productId } : { slugs: slug };
  selector.status = { $ne: ProductStatus.DELETED };
  return !!Products.find(selector, { limit: 1 }).count();
};

Products.findProduct = ({ productId, slug }) => {
  const selector = productId ? { _id: productId } : { slugs: slug };
  return Products.findOne(selector);
};

Products.findProducts = ({
  limit,
  offset,
  tags,
  includeDrafts,
  slugs,
  sort = { sequence: 1, published: -1 },
}) => {
  const selector = {};
  const options = { sort };

  if (slugs?.length > 0) {
    selector.slugs = { $in: slugs };
  } else {
    options.skip = offset;
    options.limit = limit;

    if (tags?.length > 0) {
      selector.tags = { $all: tags };
    }
  }
  if (!includeDrafts) {
    selector.status = { $eq: ProductStatus.ACTIVE };
  } else {
    selector.status = { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] };
  }
  return Products.find(selector, options).fetch();
};

Products.count = async ({ tags, includeDrafts, slugs }) => {
  const selector = {};

  if (slugs?.length > 0) {
    selector.slugs = { $in: slugs };
  } else if (tags?.length > 0) {
    selector.tags = { $all: tags };
  }
  if (!includeDrafts) {
    selector.status = { $eq: ProductStatus.ACTIVE };
  } else {
    selector.status = { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] };
  }
  const count = await Products.rawCollection().countDocuments(selector);
  return count;
};

Products.createProduct = (
  { locale, title, type, sequence, authorId, ...productData },
  { autopublish = false } = {}
) => {
  if (productData._id) {
    // Remove deleted product by _id before creating a new one.
    Products.permanentlyRemoveDeletedProduct({ productId: productData._id });
  }
  const productId = Products.insert({
    created: new Date(),
    type: ProductTypes[type],
    status: ProductStatus.DRAFT,
    sequence: sequence ?? Products.find({}).count() + 10,
    authorId,
    ...productData,
  });
  const product = Products.findOne({ _id: productId });
  if (locale) {
    product.upsertLocalizedText(locale, { title, authorId });
    if (autopublish) {
      product.publish();
    }
  }
  emit('PRODUCT_CREATE', { product });
  return product;
};

Products.updateProduct = ({ productId, type, ...product }) => {
  const modifier = {
    $set: {
      ...product,
      updated: new Date(),
    },
  };
  if (type) {
    modifier.$set.type = ProductTypes[type];
  }
  const result = Products.update({ _id: productId }, modifier);
  emit('PRODUCT_UPDATE', { productId, type, ...product });
  return result;
};
ProductTexts.findProductTexts = ({ productId }) => {
  return ProductTexts.find({ productId }).fetch();
};

ProductTexts.makeSlug = ({ slug, title, productId }, options) => {
  const checkSlugIsUnique = (newPotentialSlug) => {
    return (
      ProductTexts.find({
        productId: { $ne: productId },
        slug: newPotentialSlug,
      }).count() === 0
    );
  };
  return findUnusedSlug(
    checkSlugIsUnique,
    options
  )({
    existingSlug: slug,
    title: title || productId,
  });
};

Products.addProxyAssignment = ({ productId, proxyId, vectors }) => {
  const vector = {};
  vectors.forEach(({ key, value }) => {
    vector[key] = value;
  });
  const modifier = {
    $set: {
      updated: new Date(),
    },
    $push: {
      'proxy.assignments': {
        vector,
        productId,
      },
    },
  };
  emit('PRODUCT_ADD_ASSIGNMENT', { productId, proxyId });
  return Products.update({ _id: proxyId }, modifier);
};

Products.createBundleItem = ({ productId, item }) => {
  const result = Products.update(
    { _id: productId },
    {
      $set: {
        updated: new Date(),
      },
      $push: {
        bundleItems: item,
      },
    }
  );
  emit('PRODUCT_CREATE_BUNDLE_ITEM', { productId });
  return result;
};

Products.removeBundleItem = ({ productId, index }) => {
  // TODO: There has to be a better MongoDB way to do this!
  const product = Products.findOne({ _id: productId });
  const { bundleItems = [] } = product;
  const removedItem = bundleItems.splice(index, 1);

  const result = Products.update(
    { _id: productId },
    {
      $set: {
        updated: new Date(),
        bundleItems,
      },
    }
  );
  emit('PRODUCT_REMOVE_BUNDLE_ITEM', {
    productId,
    item: removedItem,
  });
  return result;
};

Products.permanentlyRemoveDeletedProduct = ({ productId }) => {
  Products.remove({ status: ProductStatus.DELETED, _id: productId });
};

Products.removeProduct = ({ productId }) => {
  const product = Products.findOne({ _id: productId });
  switch (product.status) {
    case ProductStatus.ACTIVE:
      product.unpublish();
    // falls through
    case ProductStatus.DRAFT:
      AssortmentProducts.removeProduct({ productId });
      Products.update(
        { _id: productId },
        {
          $set: {
            status: ProductStatus.DELETED,
            updated: new Date(),
          },
        }
      );
      emit('PRODUCT_REMOVE', { productId });
      break;
    default:
      throw new Error(`Invalid status', ${product.status}`);
  }
};

Products.removeAssignment = ({ productId, vectors }) => {
  const vector = {};
  vectors.forEach(({ key, value }) => {
    vector[key] = value;
  });
  const modifier = {
    $set: {
      updated: new Date(),
    },
    $pull: {
      'proxy.assignments': {
        vector,
      },
    },
  };
  Products.update({ _id: productId }, modifier, { multi: true });
  emit('PRODUCT_REMOVE_ASSIGNMENT', { productId });
};

AssortmentProducts.helpers({
  product() {
    return Products.findOne({ _id: this.productId });
  },
});

Products.helpers({
  assortmentIds() {
    return AssortmentProducts.find(
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
    const productIds = AssortmentProducts.find({
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

  publish() {
    switch (this.status) {
      case ProductStatus.DRAFT:
        Products.update(
          { _id: this._id },
          {
            $set: {
              status: ProductStatus.ACTIVE,
              updated: new Date(),
              published: new Date(),
            },
          }
        );
        emit('PRODUCT_PUBLISH', { product: this });
        return true;
      default:
        return false;
    }
  },
  unpublish() {
    switch (this.status) {
      case ProductStatus.ACTIVE:
        Products.update(
          { _id: this._id },
          {
            $set: {
              status: ProductStatus.DRAFT,
              updated: new Date(),
              published: null,
            },
          }
        );
        emit('PRODUCT_UNPUBLISH', { product: this });
        return true;
      default:
        return false;
    }
  },
  upsertLocalizedText(locale, { slug: forcedSlug, title = null, ...fields }) {
    const slug = ProductTexts.makeSlug({
      slug: forcedSlug,
      title,
      productId: this._id,
    });
    const modifier = {
      $set: {
        updated: new Date(),
        title,
        ...fields,
      },
      $setOnInsert: {
        created: new Date(),
        productId: this._id,
        locale,
      },
    };
    if (forcedSlug) {
      modifier.$set.slug = slug;
    } else {
      modifier.$setOnInsert.slug = slug;
    }
    const { insertedId, numberAffected } = ProductTexts.upsert(
      {
        productId: this._id,
        locale,
      },
      modifier
    );

    if (insertedId || numberAffected) {
      Products.update(
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
      Products.update(
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
    return ProductTexts.findOne(
      insertedId ? { _id: insertedId } : { productId: this._id, locale }
    );
  },
  updateTexts({ texts, userId }) {
    const productTexts = texts.map(({ locale, ...localizations }) =>
      this.upsertLocalizedText(locale, {
        ...localizations,
        authorId: userId,
      })
    );
    emit('PRODUCT_UPDATE_TEXTS', {
      product: this,
      productTexts,
    });
    return productTexts;
  },
  addMediaLink(mediaData) {
    return ProductMedia.createMedia({
      productId: this._id,
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
      ? Media.insertWithRemoteFile({
          file: rawFile,
          userId: authorId,
        })
      : Media.insertWithRemoteURL({
          url: href,
          fileName: name,
          userId: authorId,
          ...options,
        });
    const file = Promise.await(fileLoader);
    const productMedia = this.addMediaLink({
      mediaId: file._id,
      tags,
      meta,
      authorId,
      sortKey,
    });
    emit('PRODUCT_ADD_MEDIA', { productMedia });
    return productMedia;
  },
  getLocalizedTexts(locale) {
    const parsedLocale = new Locale(locale);
    return Products.getLocalizedTexts(this._id, parsedLocale);
  },
  normalizedStatus() {
    return objectInvert(ProductStatus)[this.status || null];
  },
  media({ limit, offset, tags }) {
    const selector = { productId: this._id };
    if (tags && tags.length > 0) {
      selector.tags = { $all: tags };
    }
    console.log(selector);
    const x = ProductMedia.find(selector, {
      skip: offset,
      limit,
      sort: { sortKey: 1 },
    }).fetch();
    console.log(x);
    return x;
  },
  variations() {
    return ProductVariations.find({ productId: this._id }).fetch();
  },
  variation(key) {
    return ProductVariations.findOne({ productId: this._id, key });
  },
  proxyAssignments({ includeInactive = false } = {}) {
    const assignments = this.proxy?.assignments || [];

    const productIds = assignments.map(({ productId }) => productId);
    const selector = {
      _id: { $in: productIds },
      status: includeInactive
        ? { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] }
        : ProductStatus.ACTIVE,
    };
    const supportedProductIds = Products.find(selector, {
      fields: { _id: 1 },
    })
      .fetch()
      .map(({ _id }) => _id);

    return assignments
      .filter(({ productId }) => {
        return supportedProductIds.includes(productId);
      })
      .map((assignment) => ({
        assignment,
        product: this,
      }));
  },
  proxyProducts(vectors, { includeInactive = false } = {}) {
    const { proxy = {} } = this;
    let filtered = [...(proxy.assignments || [])];

    vectors.forEach(({ key, value }) => {
      filtered = filtered.filter((assignment) => {
        if (assignment.vector[key] === value) {
          return true;
        }
        return false;
      });
    });
    const productIds = filtered.map(
      (filteredAssignment) => filteredAssignment.productId
    );
    const selector = {
      _id: { $in: productIds },
      status: includeInactive
        ? { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] }
        : ProductStatus.ACTIVE,
    };
    return Products.find(selector).fetch();
  },
  userDispatches({ deliveryProviderType, ...options }, requestContext) {
    const deliveryProviders = DeliveryProviders.findProviders({
      type: deliveryProviderType,
    });
    return deliveryProviders.reduce(
      (oldResult, deliveryProvider) =>
        oldResult.concat(
          oldResult,
          WarehousingProviders.findSupported({
            product: this,
            deliveryProvider,
          }).map((warehousingProvider) => {
            const context = {
              warehousingProvider,
              deliveryProvider,
              product: this,
              requestContext,
              ...options,
            };
            const dispatch = warehousingProvider.estimatedDispatch(context);
            return {
              ...context,
              ...dispatch,
            };
          })
        ),
      []
    );
  },

  userStocks({ deliveryProviderType, ...options }, requestContext) {
    const deliveryProviders = DeliveryProviders.findProviders({
      type: deliveryProviderType,
    });
    return deliveryProviders.reduce(
      (oldResult, deliveryProvider) =>
        oldResult.concat(
          oldResult,
          WarehousingProviders.findSupported({
            product: this,
            deliveryProvider,
          }).map((warehousingProvider) => {
            const context = {
              warehousingProvider,
              deliveryProvider,
              product: this,
              requestContext,
              ...options,
            };
            const stock = warehousingProvider.estimatedStock(context);
            return {
              ...context,
              ...stock,
            };
          })
        ),
      []
    );
  },

  userDiscounts(/* { quantity, country, userId }, requestContext */) {
    // TODO: User Discount Simulation
    return [];
  },

  userPrice(
    { quantity = 1, country, currency, user, useNetPrice },
    requestContext
  ) {
    const currencyCode =
      currency ||
      Countries.resolveDefaultCurrencyCode({
        isoCode: country,
      });

    const pricingDirector = new ProductPricingDirector({
      product: this,
      user,
      country,
      currency: currencyCode,
      quantity,
      requestContext,
    });

    const calculated = pricingDirector.calculate();
    if (!calculated) return null;

    const pricing = pricingDirector.resultSheet();
    const userPrice = pricing.unitPrice({ useNetPrice });
    return {
      _id: crypto
        .createHash('sha256')
        .update(
          [
            this._id,
            country,
            quantity,
            useNetPrice,
            user ? user._id : 'ANONYMOUS',
          ].join('')
        )
        .digest('hex'),
      amount: userPrice.amount,
      currencyCode: userPrice.currency,
      isTaxable: pricing.taxSum() > 0,
      isNetPrice: useNetPrice,
    };
  },
  price({ country: countryCode, currency: forcedCurrencyCode, quantity = 1 }) {
    const currencyCode =
      forcedCurrencyCode ||
      Countries.resolveDefaultCurrencyCode({
        isoCode: countryCode,
      });

    const pricing = getPriceLevels(this, {
      currencyCode,
      countryCode,
    });
    const foundPrice = pricing.find(
      (level) => !level.maxQuantity || level.maxQuantity >= quantity
    );

    const price = {
      amount: null,
      currencyCode,
      countryCode,
      isTaxable: false,
      isNetPrice: false,
      ...foundPrice,
    };

    if (price.amount !== undefined && price.amount !== null) {
      return {
        _id: crypto
          .createHash('sha256')
          .update([this._id, countryCode, currencyCode].join(''))
          .digest('hex'),
        ...price,
      };
    }
    return null;
  },
  resolveOrderableProduct({ configuration = [] }) {
    this.checkIsActive();
    if (this.type === ProductTypes.ConfigurableProduct) {
      const variations = this.variations();
      const vectors = configuration.filter(({ key: configurationKey }) => {
        const isKeyEqualsVariationKey = Boolean(
          variations.filter(
            ({ key: variationKey }) => variationKey === configurationKey
          ).length
        );
        return isKeyEqualsVariationKey;
      });
      const variants = this.proxyProducts(vectors);
      if (variants.length !== 1) {
        throw new Error(
          'There needs to be exactly one variant left when adding a ConfigurableProduct to the cart, configuration not distinct enough'
        );
      }
      const resolvedProduct = variants[0];
      resolvedProduct.checkIsActive();
      return resolvedProduct;
    }
    return this;
  },
  checkIsActive() {
    if (!this.isActive()) {
      throw new Error(
        'This product is not available for ordering at the moment'
      );
    }
  },
  isActive() {
    if (this.status === ProductStatus.ACTIVE) return true;
    return false;
  },
  reviews({ limit, offset }) {
    return ProductReviews.findReviews(
      { productId: this._id },
      { offset, limit }
    );
  },
  catalogPrices() {
    const prices = (this.commerce && this.commerce.pricing) || [];
    return prices.map((price) => ({
      _id: crypto
        .createHash('sha256')
        .update(
          [
            this._id,
            price.countryCode,
            price.currencyCode,
            price.maxQuantity,
            price.amount,
          ].join('')
        )
        .digest('hex'),
      ...price,
    }));
  },
  catalogPriceRange({
    quantity = 0,
    vectors = [],
    includeInactive = false,
    country,
    currency,
  }) {
    const proxyProducts = this.proxyProducts(vectors, { includeInactive });
    const filtered = [];
    proxyProducts.forEach((p) => {
      const catalogPrice = p.price({
        country,
        quantity,
        currency,
      });

      if (catalogPrice) {
        filtered.push(catalogPrice);
      }
    });

    if (!filtered.length) return null;
    const { minPrice, maxPrice } = getPriceRange(filtered);

    return {
      _id: crypto
        .createHash('sha256')
        .update(
          [
            this._id,
            Math.random(),
            minPrice.amount,
            minPrice.currency,
            maxPrice.amount,
            maxPrice.currency,
          ].join('')
        )
        .digest('hex'),
      minPrice,
      maxPrice,
    };
  },
  simulatedPriceRange(
    {
      quantity,
      vectors = [],
      includeInactive = false,
      currency,
      country,
      useNetPrice = false,
    },
    requestContext
  ) {
    const proxyProducts = this.proxyProducts(vectors, { includeInactive });
    const { userId, user } = requestContext;
    const filtered = [];

    proxyProducts.forEach((p) => {
      const userPrice = p.userPrice(
        {
          quantity,
          currency,
          country,
          useNetPrice,
          userId,
          user,
        },
        requestContext
      );
      if (userPrice) filtered.push(userPrice);
    });

    if (!filtered.length) return null;
    const { minPrice, maxPrice } = getPriceRange(filtered);

    return {
      _id: crypto
        .createHash('sha256')
        .update(
          [
            this._id,
            Math.random(),
            minPrice.amount,
            minPrice.currency,
            maxPrice.amount,
            maxPrice.currency,
          ].join('')
        )
        .digest('hex'),
      minPrice,
      maxPrice,
    };
  },
  leveledCatalogPrices({ currency: currencyCode, country: countryCode }) {
    const currency =
      currencyCode ||
      Countries.resolveDefaultCurrencyCode({
        isoCode: countryCode,
      });

    let previousMax = null;
    const filteredAndSortedPriceLevels = getPriceLevels(this, {
      currencyCode: currency,
      countryCode,
    });

    return filteredAndSortedPriceLevels.map((priceLevel, i) => {
      const max = priceLevel.maxQuantity || null;
      const min = previousMax ? previousMax + 1 : 0;
      previousMax = priceLevel.maxQuantity;
      return {
        minQuantity: min,
        maxQuantity:
          i === 0 && priceLevel.maxQuantity > 0 ? priceLevel.maxQuantity : max,
        price: {
          _id: crypto
            .createHash('sha256')
            .update([this._id, priceLevel.amount, currency].join(''))
            .digest('hex'),
          isTaxable: !!priceLevel.isTaxable,
          isNetPrice: !!priceLevel.isNetPrice,
          amount: priceLevel.amount,
          currencyCode: currency,
        },
      };
    });
  },
});

Products.getLocalizedTexts = (productId, locale) =>
  findLocalizedText(ProductTexts, { productId }, locale);
