import { AssortmentMedia } from 'meteor/unchained:core-assortments';
import {
  uploadFileFromURL,
  MediaObjects,
} from 'meteor/unchained:core-files-next';

const upsertAsset = async (asset) => {
  const { _id, fileName, url, ...assetData } = asset;

  try {
    if (_id && MediaObjects.find({ _id }).count() > 0)
      throw new Error('Media already exists');
    const assetObject = await uploadFileFromURL('assortment-media', {
      fileId: _id,
      fileLink: url,
      fileName,
    });
    if (!assetObject) throw new Error('Media not created');
    return assetObject;
  } catch (e) {
    MediaObjects.update({ _id }, { $set: { fileName, url, ...assetData } });
    return MediaObjects.findOne({ _id });
  }
};

const upsertMediaObject = async (media) => {
  try {
    const mediaObject = await AssortmentMedia.createMedia(media);
    return mediaObject;
  } catch (e) {
    const { _id, ...mediaData } = media;
    AssortmentMedia.update({ _id }, { $set: mediaData });
    return AssortmentMedia.findOne({ _id });
  }
};

export default async ({ media, authorId, assortmentId }) => {
  const mediaObjects = await Promise.all(
    media.map(async ({ asset, content, ...mediaData }) => {
      const file = await upsertAsset(asset);
      if (!file) throw new Error(`Unable to create binary ${asset._id}`);
      const mediaObject = await upsertMediaObject({
        authorId,
        ...mediaData,
        assortmentId,
        mediaId: file._id,
      });
      if (!mediaObject)
        throw new Error(`Unable to create media object ${mediaObject._id}`);

      if (content) {
        await Promise.all(
          Object.entries(content).map(async ([locale, localizedData]) => {
            return mediaObject.upsertLocalizedText(locale, {
              ...localizedData,
              authorId,
            });
          })
        );
      }
      return mediaObject;
    })
  );
  AssortmentMedia.remove({
    assortmentId,
    _id: { $nin: mediaObjects.map((obj) => obj._id) },
  });
};
