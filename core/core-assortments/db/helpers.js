import 'meteor/dburles:collection-helpers';
import { Countries } from 'meteor/unchained:core-countries';
import { Products } from 'meteor/unchained:core-products';
import { slugify } from 'meteor/unchained:utils';
import { findLocalizedText } from 'meteor/unchained:core';
import { Locale } from 'locale';
import * as Collections from './collections';

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

Collections.Assortments.getNewSequence = (oldSequence) => {
  const sequence = (oldSequence + 1) || (Collections.Assortments.find({}).count() * 10);
  if (Collections.Assortments.find({ sequence }).count() > 0) {
    return Collections.Assortments.getNewSequence(sequence);
  }
  return sequence;
};

Collections.Assortments.getLocalizedTexts = (assortmentId, locale) =>
  findLocalizedText(Collections.AssortmentTexts, { assortmentId }, locale);

Collections.AssortmentTexts.getUnusedSlug = (strValue, scope, isAlreadySlugified) => {
  const slug = isAlreadySlugified ? strValue : `${slugify(strValue)}`;
  if (Collections.AssortmentTexts.find({ ...scope, slug }).count() > 0) {
    return Collections.AssortmentTexts.getUnusedSlug(`${strValue}--`, scope, true);
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

Collections.AssortmentLinks.getNewSortKey = (parentAssortmentId) => {
  const lastAssortmentProduct = Collections.AssortmentLinks.findOne({
    parentAssortmentId,
  }, {
    sort: { sortKey: 1 },
  }) || { sortKey: 0 };
  return lastAssortmentProduct.sortKey + 1;
};

export default () => {
  Collections.Assortments.helpers({
    country() {
      return Countries.findOne({ isoCode: this.countryCode });
    },
    upsertLocalizedText({
      locale, title, slug: propablyUsedSlug, ...rest
    }) {
      const slug = Collections.AssortmentTexts
        .getUnusedSlug(propablyUsedSlug || `${this.sequence} - ${title}`, {
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
        },
      }, { bypassCollection2: true });

      Collections.Assortments.update({
        _id: this._id,
      }, {
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
    addProduct({ productId }) {
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
      return Collections.AssortmentProducts.findOne({ _id: assortmentProductId });
    },
    addLink({ assortmentId }) {
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
      return Collections.AssortmentLinks.findOne({ _id: assortmentProductId });
    },
    productAssignments() {
      return Collections.AssortmentProducts
        .find({ assortmentId: this._id }, {
          sort: { sortKey: 1 },
        })
        .fetch();
    },
    products() {
      const productIds = Collections.AssortmentProducts
        .find({ assortmentId: this._id }, {
          fields: { productId: 1 },
          sort: { sortKey: 1 },
        })
        .fetch()
        .map(({ productId }) => productId);
      return Collections.Assortments
        .find({ _id: { $in: productIds } })
        .fetch();
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
    children() {
      const assortmentIds = Collections.AssortmentLinks
        .find({ parentAssortmentId: this._id }, {
          fields: { childAssortmentId: 1 },
          sort: { sortKey: 1 },
        })
        .fetch()
        .map(({ childAssortmentId }) => childAssortmentId);
      return Collections.Assortments
        .find({ _id: { $in: assortmentIds } })
        .fetch();
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
    product() {
      return Products.findOne({ _id: this.productId });
    },
  });
};
