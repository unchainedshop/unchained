import { Context } from '../../../../context.js';
import { ProductNotFoundError } from '../../../../errors.js';
import normalizeMediaUrl from '../../../utils/normalizeMediaUrl.js';
import { Params } from '../schemas.js';

export default async function addProductMedia(context: Context, params: Params<'ADD_MEDIA'>) {
  const { modules, services } = context;
  const { productId, mediaName, url } = params;

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const {
    _id: fileId,
    putURL,
    type,
    size,
  } = await services.files.createSignedURL({
    directoryName: 'product-media',
    fileName: mediaName,
    meta: { productId },
  });

  const sourceResponse = await fetch(url);
  const uploadUrl = new URL(putURL, process.env.ROOT_URL || 'http://localhost:4010');
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: sourceResponse.body,
    duplex: 'half',
  } as RequestInit);

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
  }

  const file = await modules.files.findFile({ fileId });
  if (!file) throw new Error(`File not found: ${fileId}`);

  if (file.expires && new Date(file.expires).getTime() < Date.now()) {
    throw new Error(`File upload expired: ${fileId}`);
  }

  const linked = await services.files.linkFile({ fileId, size, type });
  const media = await normalizeMediaUrl([{ ...linked, mediaId: linked._id }], context);
  return { media };
}
