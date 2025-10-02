import { z } from 'zod';
import { ProductMedia } from '@unchainedshop/core-products';
import { Modules } from '../../../modules.js';
import { Services } from '../../../services/index.js';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';
import upsertAsset, { AssetSchema } from '../../upsertAsset.js';

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
      const tags = mediaData?.tags ? convertTagsToLowerCase(mediaData?.tags)! : [];
      const file = await upsertAsset(
        'product-media',
        { meta: { ...(asset.meta || {}), productId }, ...asset },
        unchainedAPI,
      );
      if (!file) throw new Error(`Unable to create binary ${asset._id}`);
      const fileId = file._id;
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
