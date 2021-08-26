import 'meteor/dburles:collection-helpers';
import { findLocalizedText } from 'meteor/unchained:utils';
import { Locale } from 'locale';
import { emit } from 'meteor/unchained:core-events';
import {
  createSignedPutURL,
  MediaObjects,
} from 'meteor/unchained:core-files-next';
import { AssortmentMedia, AssortmentMediaTexts } from './collections';

AssortmentMedia.findAssortmentMedia = ({ assortmentMediaId }) => {
  return AssortmentMedia.findOne({ _id: assortmentMediaId });
};

AssortmentMedia.removeAssortmentMedia = ({ assortmentMediaId }) => {
  const result = AssortmentMedia.remove({ _id: assortmentMediaId });
  emit('ASSORTMENT_REMOVE_MEDIA', { assortmentMediaId });
  return result;
};

AssortmentMedia.createSignedUploadURL = async (
  originalFileName,
  { userId, ...context }
) => {
  return createSignedPutURL('assortment-media', originalFileName, {
    userId,
    ...context,
  });
};
AssortmentMedia.helpers({
  upsertLocalizedText(locale, fields) {
    AssortmentMediaTexts.upsert(
      {
        assortmentMediaId: this._id,
        locale,
      },
      {
        $set: {
          updated: new Date(),
          ...fields,
        },
        $setOnInsert: {
          created: new Date(),
          assortmentMediaId: this._id,
          locale,
        },
      }
    );
    return AssortmentMediaTexts.findOne({
      assortmentMediaId: this._id,
      locale,
    });
  },
  updateTexts({ texts, userId }) {
    const mediaTexts = texts.map(({ locale, ...localizations }) =>
      this.upsertLocalizedText(locale, {
        ...localizations,
        authorId: userId,
      })
    );
    emit('ASSORTMENT_UPDATE_MEDIA_TEXT', {
      assortmentMedia: this,
      mediaTexts,
    });
    return mediaTexts;
  },
  getLocalizedTexts(locale) {
    const parsedLocale = new Locale(locale);
    return AssortmentMedia.getLocalizedTexts(this._id, parsedLocale);
  },
  file() {
    return MediaObjects.findOne({ _id: this.mediaId });
  },
});

AssortmentMediaTexts.findAssortmentMediaTexts = ({ assortmentMediaId }) => {
  return AssortmentMediaTexts.find({ assortmentMediaId }).fetch();
};

AssortmentMedia.getLocalizedTexts = (assortmentMediaId, locale) =>
  findLocalizedText(AssortmentMediaTexts, { assortmentMediaId }, locale);

AssortmentMedia.createMedia = ({ assortmentId, ...mediaData }) => {
  const sortKey =
    mediaData.sortKey || AssortmentMedia.getNewSortKey(assortmentId);
  const assortmentMediaId = AssortmentMedia.insert({
    tags: [],
    ...mediaData,
    sortKey,
    assortmentId,
    created: new Date(),
  });
  return AssortmentMedia.findOne({ _id: assortmentMediaId });
};

AssortmentMedia.getNewSortKey = (assortmentId) => {
  const lastAssortmentMedia = AssortmentMedia.findOne(
    {
      assortmentId,
    },
    {
      sort: { sortKey: -1 },
    }
  ) || { sortKey: 0 };
  return lastAssortmentMedia.sortKey + 1;
};

AssortmentMedia.updateManualOrder = ({ sortKeys }) => {
  const changedMediaIds = sortKeys.map(({ assortmentMediaId, sortKey }) => {
    AssortmentMedia.update(
      {
        _id: assortmentMediaId,
      },
      {
        $set: { sortKey: sortKey + 1, updated: new Date() },
      }
    );
    return assortmentMediaId;
  });
  const assortmentMedias = AssortmentMedia.find({
    _id: { $in: changedMediaIds },
  }).fetch();
  emit('ASSORTMENT_REORDER_MEDIA', { assortmentMedias });
  return assortmentMedias;
};
