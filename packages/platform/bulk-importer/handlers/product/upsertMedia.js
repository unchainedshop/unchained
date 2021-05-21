import { ProductMedia, Media } from 'meteor/unchained:core-products';

const upsertAsset = async (asset) => {
  const { _id, ...assetData } = asset;

  try {
    const assetObject = await Media.insertWithRemoteURL({
      fileId: _id,
      ...assetData,
    });
    if (!assetObject) throw new Error('Media not created');
    return assetObject;
  } catch (e) {
    Media.update({ _id }, { $set: assetData });
    return Media.findOne({ _id });
  }
};

const upsertMediaObject = async (media) => {
  try {
    const mediaObject = await ProductMedia.createMedia(media);
    return mediaObject;
  } catch (e) {
    const { _id, ...mediaData } = media;
    ProductMedia.update({ _id }, { $set: mediaData });
    return ProductMedia.findOne({ _id });
  }
};

export default async ({ media, authorId, productId }) => {
  const mediaObjects = await Promise.all(
    media.map(async ({ asset, content, ...mediaData }) => {
      const file = await upsertAsset(asset);
      if (!file) throw new Error(`Unable to create binary ${asset._id}`);
      const mediaObject = await upsertMediaObject({
        authorId,
        ...mediaData,
        productId,
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
  ProductMedia.remove({
    productId,
    _id: { $nin: mediaObjects.map((obj) => obj._id) },
  });
};
