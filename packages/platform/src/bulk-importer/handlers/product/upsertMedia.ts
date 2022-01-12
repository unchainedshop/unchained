import { Context } from '@unchainedshop/types/api';
import { File } from '@unchainedshop/types/files';
import {
  ProductMedia,
  ProductMediaText,
} from '@unchainedshop/types/products.media';
import { dbIdToString } from 'meteor/unchained:utils';

const upsertAsset = async (
  asset: File & { fileName: string },
  { modules, userId }: Context
) => {
  const { _id, fileName, url, ...assetData } = asset;
  const fileId = _id as string;

  try {
    if (_id && (await modules.files.findFile({ fileId })))
      throw new Error('Media already exists');

    const assetObject = await modules.files.uploadFileFromURL(
      'product-media',
      {
        fileName,
        fileLink: url,
      },
      {
        fileId,
      },
      userId
    );

    if (!assetObject) throw new Error('Media not created');
    return assetObject;
  } catch (e) {
    await modules.files.update(fileId, { fileName, url, ...assetData }, userId);
    return modules.files.findFile({ fileId });
  }
};

const upsertProductMedia = async (
  productMedia: ProductMedia,
  { modules, userId }: Context
) => {
  try {
    return await modules.products.media.create(productMedia, userId);
  } catch (e) {
    const { _id, ...productMediaData } = productMedia;
    const productMediaId = _id as string;
    await modules.products.media.update(productMediaId, productMediaData);
    return await modules.products.media.findProductMedia({ productMediaId });
  }
};

export default async function upsertMedia(
  { media, authorId, productId },
  unchainedAPI: Context
) {
  const { modules, userId } = unchainedAPI;

  const productMediaObjects = await Promise.all(
    media.map(async ({ asset, content, ...mediaData }) => {
      const file = await upsertAsset(asset, unchainedAPI);
      if (!file) throw new Error(`Unable to create binary ${asset._id}`);
      const fileId = dbIdToString(file._id);
      const productMedia = await upsertProductMedia(
        {
          authorId,
          ...mediaData,
          productId,
          mediaId: dbIdToString(file._id),
        } as ProductMedia,
        unchainedAPI
      );

      if (!productMedia)
        throw new Error(
          `Unable to create product media object for file ${fileId}`
        );

      if (content) {
        await Promise.all(
          Object.entries(content).map(
            async ([locale, localizedData]: [string, ProductMediaText]) => {
              return await modules.products.media.texts.upsertLocalizedText(
                dbIdToString(productMedia._id),
                locale,
                {
                  ...localizedData,
                  authorId,
                },
                userId
              );
            }
          )
        );
      }
      return productMedia;
    })
  );

  await modules.products.media.deleteMediaFiles({
    productId,
    exlcudedProductMediaIds: productMediaObjects.map((obj) => obj._id),
  });
}
