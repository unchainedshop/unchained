import 'meteor/dburles:collection-helpers';
import { findLocalizedText } from 'meteor/unchained:utils';
import { Locale } from 'locale';
import { emit } from 'meteor/unchained:core-events';
import {
  createSignedPutURL,
  MediaObjects,
} from 'meteor/unchained:core-files-next';

import { ProductMedia, ProductMediaTexts } from './collections';

ProductMedia.findProductMedia = ({ productMediaId }) => {
  return ProductMedia.findOne({ _id: productMediaId });
};

ProductMedia.removeProductMedia = ({ productMediaId }) => {
  const result = ProductMedia.remove({ _id: productMediaId });
  emit('PRODUCT_REMOVE_MEDIA', { productMediaId });
  return result;
};

ProductMedia.createSignedUploadURL = async (
  originalFileName,
  { userId, ...context }
) => {
  return createSignedPutURL(originalFileName, {
    userId,
    ...context,
  });
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
    const mediaTexts = texts.map(({ locale, ...localizations }) =>
      this.upsertLocalizedText(locale, {
        ...localizations,
        authorId: userId,
      })
    );
    emit('PRODUCT_UPDATE_MEDIA_TEXT', {
      productMedia: this,
      mediaTexts,
    });
    return mediaTexts;
  },
  getLocalizedTexts(locale) {
    const parsedLocale = new Locale(locale);
    return ProductMedia.getLocalizedTexts(this._id, parsedLocale);
  },
  file() {
    const media = MediaObjects.findOne({ _id: this.mediaId });
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
  const productMedias = ProductMedia.find({
    _id: { $in: changedMediaIds },
  }).fetch();
  emit('PRODUCT_REORDER_MEDIA', { productMedias });
  return productMedias;
};
