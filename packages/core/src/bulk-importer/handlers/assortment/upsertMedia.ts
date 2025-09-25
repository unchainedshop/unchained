import { Services } from '../../../services/index.js';
import { Modules } from '../../../modules.js';
import upsertAsset from '../../upsertAsset.js';

const upsertMediaObject = async (media, unchainedAPI: { modules: Modules; services: Services }) => {
  const { modules } = unchainedAPI;
  try {
    const assortmentMedia = await modules.assortments.media.create(media);
    return assortmentMedia;
  } catch {
    const { _id, ...mediaData } = media;
    return modules.assortments.media.update(_id, mediaData);
  }
};

export default async (
  { media, assortmentId },
  unchainedAPI: { modules: Modules; services: Services },
) => {
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
          ...mediaData,
          assortmentId,
          mediaId: file._id,
        },
        unchainedAPI,
      );

      if (!mediaObject) throw new Error(`Unable to create media object ${mediaObject._id}`);

      if (content) {
        await modules.assortments.media.texts.updateMediaTexts(
          mediaObject._id,
          Object.entries(content).map(([locale, localizedData]: [string, any]) => ({
            locale,
            ...localizedData,
          })),
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
