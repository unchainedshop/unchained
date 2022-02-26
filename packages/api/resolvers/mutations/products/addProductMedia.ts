import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductNotFoundError, InvalidIdError } from '../../../errors';

export default async function addProductMedia(root: Root, { media, productId }, context: Context) {
  const { modules, services, userId } = context;
  log(`mutation addProductMedia ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const file = await services.files.uploadFileFromStream(
    {
      directoryName: 'product-media',
      rawFile: media,
      meta: { productId },
      userId,
    },
    context,
  );

  return modules.products.media.create({ productId, mediaId: file._id }, userId);
}
