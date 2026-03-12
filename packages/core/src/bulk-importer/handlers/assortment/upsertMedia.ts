import { z } from 'zod/v4-mini';
import type { Services } from '../../../services/index.ts';
import type { Modules } from '../../../modules.ts';
import upsertAsset, { AssetSchema } from '../../upsertAsset.ts';
import type { AssortmentMediaType } from '@unchainedshop/core-assortments';

export const MediaSchema = z.object({
  _id: z.optional(z.string()),
  asset: AssetSchema,
  content: z.optional(
    z.record(
      z.string(), // locale
      z.object({
        title: z.optional(z.string()),
        subtitle: z.optional(z.string()),
      }),
    ),
  ),
  tags: z.optional(z.array(z.string())),
  sortKey: z.optional(z.number()),
});

const upsertMediaObject = async (media, unchainedAPI: { modules: Modules; services: Services }) => {
  const { modules } = unchainedAPI;
  try {
    const assortmentMedia = (await modules.assortments.media.create(media)) as AssortmentMediaType;
    return assortmentMedia;
  } catch {
    const { _id, ...mediaData } = media;
    return (await modules.assortments.media.update(_id, mediaData)) as AssortmentMediaType;
  }
};

export default async (
  { media, assortmentId }: { media: z.infer<typeof MediaSchema>[]; assortmentId: string },
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

      if (!mediaObject) throw new Error(`Unable to create media object ${mediaData._id}`);

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
