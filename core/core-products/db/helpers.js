import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { ProductPricingDirector } from 'meteor/unchained:core-pricing';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { findLocalizedText } from 'meteor/unchained:core';
import { objectInvert, slugify } from 'meteor/unchained:utils';
import { Locale } from 'locale';
import crypto from 'crypto';
import {
  Products, ProductMedia, Media, ProductTexts,
  ProductMediaTexts, ProductVariations, ProductVariationTexts,
} from './collections';
import { ProductStatus, ProductTypes } from './schema';

Products.createProduct = ({
  authorId, locale, title, type, ...rest
}) => {
  const product = {
    created: new Date(),
    authorId,
    type: ProductTypes[type],
    status: ProductStatus.DRAFT,
    sequence: Products.getNewSequence(),
    ...rest,
  };
  const productId = Products.insert(product);
  const productObject = Products.findOne({ _id: productId });
  productObject.upsertLocalizedText({ locale, title });
  return productObject;
};

Products.getNewSequence = (oldSequence) => {
  const sequence = (oldSequence + 1) || (Products.find({}).count() * 10);
  if (Products.find({ sequence }).count() > 0) {
    return Products.getNewSequence(sequence);
  }
  return sequence;
};

export default () => {
  const { Users } = Promise.await(import('meteor/unchained:core-users'));
  const { Countries } = Promise.await(import('meteor/unchained:core-countries'));

  Products.helpers({
    upsertLocalizedText({
      locale, title, slug: propablyUsedSlug, ...rest
    }) {
      const slug = ProductTexts
        .getUnusedSlug(propablyUsedSlug || `${this.sequence} - ${title}`, {
          productId: { $ne: this._id },
        }, !!propablyUsedSlug);

      ProductTexts.upsert({
        productId: this._id,
        locale,
      }, {
        $set: {
          title,
          locale,
          slug,
          ...rest,
        },
      }, { bypassCollection2: true });

      Products.update({
        _id: this._id,
      }, {
        $addToSet: {
          slugs: slug,
        },
      });
      return ProductTexts.findOne({ productId: this._id, locale });
    },
    addMedia({
      rawFile, href, name, userId, meta,
    }) {
      const fileLoader = rawFile ? Media.insertWithRemoteBuffer({
        file: rawFile,
        userId,
      }) : Media.insertWithHref(href, name);
      const file = Promise.await(fileLoader);
      const sortKey = ProductMedia.getNewSortKey(this._id);

      const productMediaId = ProductMedia.insert({
        mediaId: file._id,
        tags: [],
        sortKey,
        productId: this._id,
        created: new Date(),
        ...meta,
      });
      const productMediaObject = ProductMedia.findOne({ _id: productMediaId });
      return productMediaObject;
    },
    getLocalizedTexts(locale) {
      const parsedLocale = new Locale(locale);
      return Products.getLocalizedTexts(this._id, parsedLocale);
    },
    normalizedStatus() {
      return objectInvert(ProductStatus)[this.status];
    },
    media() {
      return ProductMedia.find({ productId: this._id }, { sort: { sortKey: 1 } }).fetch();
    },
    variations() {
      return ProductVariations.find({ productId: this._id }).fetch();
    },
    variation(key) {
      return ProductVariations.findOne({ productId: this._id, key });
    },
    proxyAssignments() {
      return ((this.proxy && this.proxy.assignments) || []).map(assignment => ({
        assignment,
        product: this,
      }));
    },
    proxyProducts(vectors) {
      const { proxy = { } } = this;
      let filtered = [...(proxy.assignments || [])];
      vectors.forEach(({ key, value }) => {
        filtered = filtered.filter((assignment) => {
          if (assignment.vector[key] === value) {
            return true;
          }
          return false;
        });
      });
      const productIds = filtered.map(filteredAssignment => filteredAssignment.productId);
      return Products.find({ _id: { $in: productIds } }).fetch();
    },

    userDispatches({
      deliveryProviderType, quantity, country, userId,
    }) {
      const deliveryProviders = DeliveryProviders.find({ type: deliveryProviderType }).fetch();
      return deliveryProviders.reduce(
        (oldResult, deliveryProvider) => oldResult
          .concat(oldResult, WarehousingProviders.findSupported({ product: this, deliveryProvider })
            .map((warehousingProvider) => {
              const context = {
                warehousingProvider,
                deliveryProvider,
                product: this,
                quantity,
                country,
                userId,
                referenceDate: new Date(),
              };
              const dispatch = warehousingProvider.estimatedDispatch(context);
              return {
                ...context,
                ...dispatch,
              };
            })),
        [],
      );
    },

    userDiscounts(/* { quantity, country, userId } */) {
      // TODO: User Discount Simulation
      return [];
    },

    userPrice({
      quantity, country, userId, useNetPrice,
    }) {
      const currency = Countries.resolveDefaultCurrencyCode({
        isoCode: country,
      });
      const user = Users.findOne({ _id: userId });
      const pricingDirector = new ProductPricingDirector({
        product: this,
        user,
        country,
        currency,
        quantity,
      });
      pricingDirector.calculate();
      const pricing = pricingDirector.resultSheet();
      const userPrice = pricing.unitPrice({ useNetPrice });

      return {
        _id: crypto
          .createHash('sha256')
          .update([this._id, quantity._id, country, useNetPrice, userId || 'ANONYMOUS'].join(''))
          .digest('hex'),
        amount: userPrice.amount,
        currencyCode: userPrice.currency,
        countryCode: country,
        isTaxable: (pricing.taxSum() > 0),
        isNetPrice: useNetPrice,
      };
    },
    price({ country }) {
      const currency = Countries.resolveDefaultCurrencyCode({
        isoCode: country,
      });
      const pricing = (this.commerce && this.commerce.pricing) || [];
      return pricing.reduce((oldValue, curPrice) => {
        if (curPrice.currencyCode === currency
          && curPrice.countryCode === country) {
          return {
            ...oldValue,
            ...curPrice,
          };
        }
        return oldValue;
      }, {
        _id: crypto
          .createHash('sha256')
          .update([this._id, country, currency].join(''))
          .digest('hex'),
        amount: 0,
        currencyCode: currency,
        countryCode: country,
        isTaxable: false,
        isNetPrice: false,
      });
    },
  });
};

ProductMedia.helpers({
  upsertLocalizedText({ locale, ...rest }) {
    const localizedData = { locale, ...rest };
    ProductMediaTexts.upsert({
      productMediaId: this._id,
      locale,
    }, { $set: localizedData }, { bypassCollection2: true });
    return ProductMediaTexts.findOne({ productMediaId: this._id, locale });
  },
  getLocalizedTexts(locale) {
    const parsedLocale = new Locale(locale);
    return ProductMedia.getLocalizedTexts(this._id, parsedLocale);
  },
  file() {
    const media = Media.findOne({ _id: this.mediaId });
    return media;
  },
});

ProductVariations.helpers({
  upsertLocalizedText({ locale, productVariationOptionValue, ...rest }) {
    const localizedData = { locale, ...rest };
    ProductVariationTexts.upsert({
      productVariationId: this._id,
      productVariationOptionValue,
      locale,
    }, { $set: localizedData }, { bypassCollection2: true });
    return ProductVariationTexts.findOne({ productVariationId: this._id, locale });
  },
  getLocalizedTexts(locale, optionValue) {
    const parsedLocale = new Locale(locale);
    return ProductVariations.getLocalizedTexts(this._id, optionValue, parsedLocale);
  },
  optionObject(productVariationOption) {
    return {
      productVariationOption,
      getLocalizedTexts: this.getLocalizedTexts,
      ...this,
    };
  },
});

Products.getLocalizedTexts = (productId, locale) =>
  findLocalizedText(ProductTexts, { productId }, locale);

ProductMedia.getLocalizedTexts = (productMediaId, locale) =>
  findLocalizedText(ProductMediaTexts, { productMediaId }, locale);

ProductTexts.getUnusedSlug = (strValue, scope, isAlreadySlugified) => {
  const slug = isAlreadySlugified ? strValue : `${slugify(strValue)}`;
  if (ProductTexts.find({ ...scope, slug }).count() > 0) {
    return ProductTexts.getUnusedSlug(`${strValue}--`, scope, true);
  }
  return slug;
};

ProductVariations.getLocalizedTexts = (productVariationId, productVariationOptionValue, locale) =>
  findLocalizedText(ProductVariationTexts, {
    productVariationId,
    productVariationOptionValue,
  }, locale);

ProductMedia.getNewSortKey = (productId) => {
  const lastProductMedia = ProductMedia.findOne({
    productId,
  }, {
    sort: { sortKey: 1 },
  }) || { sortKey: 0 };
  return lastProductMedia.sortKey + 1;
};
