import { z } from 'zod';
import { createLogger } from '@unchainedshop/logger';
import type { Services } from '../../../services/index.ts';
import type { Modules } from '../../../modules.ts';
import upsertAsset, { AssetSchema } from '../../upsertAsset.ts';
import type { AssortmentMediaType } from '@unchainedshop/core-assortments';

const logger = createLogger('unchained:bulk-importer');

export const MediaSchema = z.object({
  _id: z.string().optional(),
  asset: AssetSchema,
  content: z
    .record(
      z.string(), // locale
      z.object({
        title: z.string().optional(),
        subtitle: z.string().optional(),
      }),
    )
    .optional(),
  tags: z.array(z.string()).optional(),
  sortKey: z.number().optional(),
});

interface MediaInput {
  _id?: string;
  assortmentId: string;
  mediaId: string;
  tags?: string[];
  sortKey?: number;
}

const upsertMediaObject = async (
  media: MediaInput,
  unchainedAPI: { modules: Modules; services: Services },
): Promise<AssortmentMediaType> => {
  const { modules } = unchainedAPI;

  // Check if the media object already exists
  if (media._id) {
    const existing = await modules.assortments.media.findAssortmentMedia({
      assortmentMediaId: media._id,
    });
    if (existing) {
      const { _id, ...mediaData } = media;
      const updated = await modules.assortments.media.update(_id, mediaData);
      if (!updated) {
        throw new Error(`Failed to update assortment media ${_id}`);
      }
      logger.debug(`Updated assortment media ${_id}`);
      return updated as AssortmentMediaType;
    }
  }

  const assortmentMedia = await modules.assortments.media.create(media);
  if (!assortmentMedia) {
    throw new Error(`Failed to create assortment media`);
  }
  logger.debug(`Created assortment media ${assortmentMedia._id}`);
  return assortmentMedia as AssortmentMediaType;
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
