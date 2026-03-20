import { z } from 'zod/v4-mini';
import type { ProductMedia } from '@unchainedshop/core-products';
import type { Modules } from '../../../modules.ts';
import type { Services } from '../../../services/index.ts';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.ts';
import upsertAsset, { AssetSchema } from '../../upsertAsset.ts';

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

const upsertProductMedia = async (productMedia: ProductMedia, { modules }: { modules: Modules }) => {
  try {
    const productMediaObj = await modules.products.media.create(productMedia);
    return productMediaObj;
  } catch {
    const { _id, ...productMediaData } = productMedia;
    const productMediaId = _id;
    return modules.products.media.update(productMediaId, productMediaData);
  }
};

export default async function upsertMedia(
  { media, productId }: { media: z.infer<typeof MediaSchema>[]; productId: string },
  unchainedAPI: { modules: Modules; services: Services },
) {
  const { modules } = unchainedAPI;

  const productMediaObjects = await Promise.all(
    media.map(async ({ asset, content, ...mediaData }) => {
      const file = await upsertAsset(
        'product-media',
        { meta: { ...(asset.meta || {}), productId }, ...asset },
        unchainedAPI,
      );
      if (!file) throw new Error(`Unable to create binary ${asset._id}`);
      const fileId = file._id;
      const tags = mediaData?.tags ? convertTagsToLowerCase(mediaData?.tags)! : [];
      const productMedia = await upsertProductMedia(
        {
          ...mediaData,
          tags,
          productId,
          mediaId: file._id,
        } as ProductMedia,
        unchainedAPI,
      );
      if (!productMedia) throw new Error(`Unable to create product media object for file ${fileId}`);

      if (content) {
        await modules.products.media.texts.updateMediaTexts(
          productMedia._id,
          Object.entries(content).map(([locale, localizedData]: [string, any]) => {
            return {
              locale,
              ...localizedData,
            };
          }),
        );
      }
      return productMedia;
    }),
  );

  await modules.products.media.deleteMediaFiles({
    productId,
    excludedProductMediaIds: productMediaObjects.map((obj) => obj._id),
  });
}
