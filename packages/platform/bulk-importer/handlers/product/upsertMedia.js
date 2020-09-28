import { ProductMedia, Media } from 'meteor/unchained:core-products';

export default async ({ media, authorId, productId }) => {
  return Promise.all(
    media.map(async ({ asset, content, ...mediaData }) => {
      const file = await Media.insertWithRemoteURL(asset);
      const mediaObject = await ProductMedia.createMedia({
        authorId,
        ...mediaData,
        productId,
        mediaId: file._id,
      });
      await Promise.all(
        Object.entries(content).map(async ([locale, localizedData]) => {
          return mediaObject.upsertLocalizedText(locale, {
            ...localizedData,
            authorId,
          });
        })
      );
      return mediaObject;
    })
  );
};
