import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api'
import { ProductNotFoundError, InvalidIdError } from '../../../errors';

export default async function addProductMedia(
  root: Root,
  { media, productId },
  { modules, userId }: Context
) {
  log(`mutation addProductMedia ${productId}`,{ userId });

  if (!productId) throw new InvalidIdError({ productId });
  
  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  return await modules.products.media.addMedia({ rawFile: media, authorId: userId }, userId);
}
