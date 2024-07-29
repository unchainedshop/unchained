import { ProductMedia } from '@unchainedshop/types/products.media.js';
import { UnchainedCore } from '@unchainedshop/core';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';
import upsertAsset from '../../upsertAsset.js';

const upsertProductMedia = async (productMedia: ProductMedia, { modules }: UnchainedCore) => {
  try {
    const productMediaObj = await modules.products.media.create(productMedia);
    return productMediaObj;
  } catch (e) {
    const { _id, ...productMediaData } = productMedia;
    const productMediaId = _id;
    return modules.products.media.update(productMediaId, productMediaData);
  }
};

export default async function upsertMedia({ media, productId }, unchainedAPI: UnchainedCore) {
  const { modules } = unchainedAPI;

  const productMediaObjects = await Promise.all(
    media.map(async ({ asset, content, ...mediaData }) => {
      const tags = convertTagsToLowerCase(mediaData?.tags);
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
