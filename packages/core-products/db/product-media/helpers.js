import 'meteor/dburles:collection-helpers';
import { findLocalizedText } from 'meteor/unchained:core';
import { Locale } from 'locale';
import { ProductMedia, Media, ProductMediaTexts } from './collections';

ProductMedia.helpers({
  upsertLocalizedText({ locale, ...rest }) {
    const localizedData = { locale, ...rest };
    ProductMediaTexts.upsert({
      productMediaId: this._id,
      locale,
    }, {
      $set: {
        updated: new Date(),
        ...localizedData,
      },
    }, { bypassCollection2: true });
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

ProductMedia.getLocalizedTexts = (
  productMediaId,
  locale,
) => findLocalizedText(ProductMediaTexts, { productMediaId }, locale);

ProductMedia.getNewSortKey = (productId) => {
  const lastProductMedia = ProductMedia.findOne({
    productId,
  }, {
    sort: { sortKey: 1 },
  }) || { sortKey: 0 };
  return lastProductMedia.sortKey + 1;
};
