import { ProductMedia } from 'meteor/unchained:core-products';
import {
  uploadFileFromURL,
  MediaObjects,
} from 'meteor/unchained:core-files-next';

const upsertAsset = async (asset) => {
  const { _id, fileName, url, ...assetData } = asset;

  try {
    if (_id && MediaObjects.find({ _id }).count() > 0)
      throw new Error('Media already exists');
    const assetObject = await uploadFileFromURL('product-medias', {
      fileId: _id,
      fileName,
      fileLink: url,
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
