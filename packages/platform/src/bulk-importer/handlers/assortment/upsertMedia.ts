import { Context } from '@unchainedshop/types/api';
import { AssortmentMediaText } from '@unchainedshop/types/assortments.media';
import { File } from '@unchainedshop/types/files';

const upsertAsset = async (asset: File & { fileName: string }, unchainedAPI: Context) => {
  const { modules, services, userId } = unchainedAPI;
  const { _id, fileName, url, ...assetData } = asset;
  const fileId = _id;
  try {
    if (_id && (await modules.files.findFile({ fileId }))) throw new Error('Media already exists');

    const assetObject = await services.files.uploadFileFromURL({
      directoryName: 'assortment-media',
      fileInput: {
        fileLink: url,
        fileName,
      },
      meta: { fileId },
      userId
    }, unchainedAPI);

    if (!assetObject) throw new Error('Media not created');
    return assetObject;
  } catch (e) {
    await modules.files.update(fileId, { fileName, url, ...assetData }, userId);
    return modules.files.findFile({ fileId });
  }
};

const upsertMediaObject = async (media, unchainedAPI: Context) => {
  const { modules, userId } = unchainedAPI;
  try {
    return modules.assortments.media.create(media, userId);
  } catch (e) {
    const { _id, ...mediaData } = media;
    return modules.assortments.media.update(_id, mediaData);
  }
};

export default async ({ media, authorId, assortmentId }, unchainedAPI: Context) => {
  const { modules, userId } = unchainedAPI;
  const mediaObjects = await Promise.all(
    media.map(async ({ asset, content, ...mediaData }) => {
      const file = await upsertAsset(asset, unchainedAPI);
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
              {
                ...localizedData,
                authorId,
              },
              userId,
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
