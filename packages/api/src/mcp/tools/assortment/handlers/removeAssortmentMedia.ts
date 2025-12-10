import type { Context } from '../../../../context.ts';

import type { Params } from '../schemas.ts';

export default async function removeAssortmentMedia(context: Context, params: Params<'REMOVE_MEDIA'>) {
  const { modules } = context;
  const { mediaId } = params;
  await modules.assortments.media.delete(mediaId);
  return { success: true };
}
