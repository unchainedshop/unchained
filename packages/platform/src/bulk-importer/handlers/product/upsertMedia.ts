import { Context } from '@unchainedshop/types/api';
import { File } from '@unchainedshop/types/files';
import { ProductMedia, ProductMediaText } from '@unchainedshop/types/products.media';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase';

const upsertAsset = async (
  asset: File & { fileName: string; headers?: Record<string, unknown> },
  unchainedAPI: Context,
) => {
  const { modules, services, userId } = unchainedAPI;
  const { _id, fileName, url, meta, headers, ...assetData } = asset;
  const fileId = _id;

  try {
    if (_id && (await modules.files.findFile({ fileId }))) throw new Error('Media already exists');

    const assetObject = await services.files.uploadFileFromURL(
      {
        directoryName: 'product-media',
        fileInput: {
          fileLink: url,
          fileName,
          headers,
        },
        meta: { ...meta, fileId },
        userId,
      },
      unchainedAPI,
    );

    if (!assetObject) throw new Error('Media not created');
    return assetObject;
  } catch (e) {
    if (fileId) {
      await modules.files.update(fileId, { meta: { ...meta, fileId }, ...assetData }, userId);
      const file = await modules.files.findFile({ fileId });
      return file;
    }
    return null;
  }
};

const upsertProductMedia = async (productMedia: ProductMedia, { modules, userId }: Context) => {
  try {
    const productMediaObj = await modules.products.media.create(productMedia, userId);
    return productMediaObj;
  } catch (e) {
    const { _id, ...productMediaData } = productMedia;
    const productMediaId = _id;
    return modules.products.media.update(productMediaId, productMediaData);
  }
};

export default async function upsertMedia({ media, authorId, productId }, unchainedAPI: Context) {
  const { modules, userId } = unchainedAPI;

  const productMediaObjects = await Promise.all(
    media.map(async ({ asset, content, ...mediaData }) => {
      const tags = convertTagsToLowerCase(mediaData?.tags);
      const file = await upsertAsset(
        { meta: { ...(asset.meta || {}), productId }, ...asset },
        unchainedAPI,
      );
      if (!file) throw new Error(`Unable to create binary ${asset._id}`);
      const fileId = file._id;
      const productMedia = await upsertProductMedia(
        {
          authorId,
          ...mediaData,
          tags,
          productId,
          mediaId: file._id,
        } as ProductMedia,
        unchainedAPI,
      );
      if (!productMedia) throw new Error(`Unable to create product media object for file ${fileId}`);

      if (content) {
        await Promise.all(
          Object.entries(content).map(
            async ([locale, { authorId: tAuthorId, ...localizedData }]: [string, ProductMediaText]) => {
              return modules.products.media.texts.upsertLocalizedText(
                productMedia._id,
                locale,
                localizedData,
                tAuthorId || authorId || userId,
              );
            },
          ),
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
