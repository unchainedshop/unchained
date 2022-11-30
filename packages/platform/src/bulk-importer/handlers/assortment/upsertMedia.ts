import { Context } from '@unchainedshop/types/api';
import { AssortmentMediaText } from '@unchainedshop/types/assortments.media';
import upsertAsset from '../../upsertAsset';

const upsertMediaObject = async (media, unchainedAPI: Context) => {
  const { modules } = unchainedAPI;
  try {
    const assortmentMedia = await modules.assortments.media.create(media);
    return assortmentMedia;
  } catch (e) {
    const { _id, ...mediaData } = media;
    return modules.assortments.media.update(_id, mediaData);
  }
};

export default async ({ media, authorId, assortmentId }, unchainedAPI: Context) => {
  const { modules } = unchainedAPI;
  const mediaObjects = await Promise.all(
    media.map(async ({ asset, content, ...mediaData }) => {
      const file = await upsertAsset(
        'assortment-media',
        { meta: { ...(asset.meta || {}), assortmentId }, ...asset },
        unchainedAPI,
      );
      if (!file) throw new Error(`Unable to create binary ${asset._id}`);

      const mediaObject = await upsertMediaObject(
        {
          authorId,
          ...mediaData,
          assortmentId,
          mediaId: file._id,
        },
        unchainedAPI,
      );

      if (!mediaObject) throw new Error(`Unable to create media object ${mediaObject._id}`);

      if (content) {
        await Promise.all(
          Object.entries(content).map(async ([locale, localizedData]: [string, AssortmentMediaText]) => {
            return modules.assortments.media.texts.upsertLocalizedText(
              mediaObject._id,
              locale,
              localizedData,
            );
          }),
        );
      }
      return mediaObject;
    }),
  );

  await modules.assortments.media.deleteMediaFiles({
    assortmentId,
    excludedAssortmentMediaIds: mediaObjects.map((obj) => obj._id),
  });
};
