import { Context } from '../../../../context.js';

import { Params } from '../schemas.js';

export default async function removeAssortmentMedia(context: Context, params: Params<'REMOVE_MEDIA'>) {
  const { modules } = context;
  const { mediaId } = params;
  await modules.assortments.media.delete(mediaId);
  return { success: true };
}
