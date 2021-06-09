import {
  AssortmentMedia,
  AssortmentDocuments,
} from 'meteor/unchained:core-assortments';

const upsertAsset = async (asset) => {
  const { _id, ...assetData } = asset;

  try {
    const assetObject = await AssortmentDocuments.insertWithRemoteURL({
      fileId: _id,
      ...assetData,
    });
    if (!assetObject) throw new Error('Media not created');
    return assetObject;
  } catch (e) {
    AssortmentDocuments.update({ _id }, { $set: assetData });
    return AssortmentDocuments.findOne({ _id });
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
