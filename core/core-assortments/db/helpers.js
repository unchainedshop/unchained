import 'meteor/dburles:collection-helpers';
import { Countries } from 'meteor/unchained:core-countries';
import { slugify } from 'meteor/unchained:utils';
import { findLocalizedText } from 'meteor/unchained:core';
import { Locale } from 'locale';
import * as Collections from './collections';

Collections.Assortments.createAssortment = ({
  locale, title, isBase = false, isActive = true, meta,
}) => {
  const assortment = {
    created: new Date(),
    isBase,
    isActive,
  };
  if (meta) assortment.meta = { ...meta };
  const assortmentId = Collections.Assortments.insert(assortment);
  const assortmentObject = Collections.Assortments.findOne({ _id: assortmentId });
  assortmentObject.upsertLocalizedText({ locale, title });
  return assortmentObject;
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
      const assortmentProductId = Collections.AssortmentLinks.insert({
        parentAssortmentId: this._id,
        childAssortmentId: assortmentId,
        sortKey,
        created: new Date(),
      });
      return Collections.AssortmentLinks.findOne({ _id: assortmentProductId });
    },
  });

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
};
