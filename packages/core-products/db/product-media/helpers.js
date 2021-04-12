import 'meteor/dburles:collection-helpers';
import { findLocalizedText } from 'meteor/unchained:utils';
import { Locale } from 'locale';
import { ProductMedia, Media, ProductMediaTexts } from './collections';

ProductMedia.findProductMedia = ({ productMediaId }) => {
  return ProductMedia.findOne({ _id: productMediaId });
};

ProductMedia.removeProductMedia = ({ productMediaId }) => {
  return ProductMedia.remove({ _id: productMediaId });
};

ProductMedia.helpers({
  upsertLocalizedText(locale, fields) {
    ProductMediaTexts.upsert(
      {
        productMediaId: this._id,
        locale,
      },
      {
        $set: {
          updated: new Date(),
          ...fields,
        },
        $setOnInsert: {
          created: new Date(),
          productMediaId: this._id,
          locale,
        },
      }
    );
    return ProductMediaTexts.findOne({ productMediaId: this._id, locale });
  },
  updateTexts({ texts, userId }) {
    return texts.map(({ locale, ...localizations }) =>
      this.upsertLocalizedText(locale, {
        ...localizations,
        authorId: userId,
      })
    );
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

ProductMediaTexts.findProductMediaTexts = ({ productMediaId }) => {
  return ProductMediaTexts.find({ productMediaId }).fetch();
};

ProductMedia.getLocalizedTexts = (productMediaId, locale) =>
  findLocalizedText(ProductMediaTexts, { productMediaId }, locale);

ProductMedia.createMedia = ({ productId, ...mediaData }) => {
  const sortKey = mediaData.sortKey || ProductMedia.getNewSortKey(productId);
  const productMediaId = ProductMedia.insert({
    tags: [],
    ...mediaData,
    sortKey,
    productId,
    created: new Date(),
  });
  return ProductMedia.findOne({ _id: productMediaId });
};

ProductMedia.getNewSortKey = (productId) => {
  const lastProductMedia = ProductMedia.findOne(
    {
      productId,
    },
    {
      sort: { sortKey: -1 },
    }
  ) || { sortKey: 0 };
  return lastProductMedia.sortKey + 1;
};

ProductMedia.updateManualOrder = ({ sortKeys }) => {
  const changedMediaIds = sortKeys.map(({ productMediaId, sortKey }) => {
    ProductMedia.update(
      {
        _id: productMediaId,
      },
      {
        $set: { sortKey: sortKey + 1, updated: new Date() },
      }
    );
    return productMediaId;
  });
  return ProductMedia.find({ _id: { $in: changedMediaIds } }).fetch();
};
