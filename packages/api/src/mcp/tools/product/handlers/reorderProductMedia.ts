import { Context } from '../../../../context.js';
import normalizeMediaUrl from '../../../utils/normalizeMediaUrl.js';
import { Params } from '../schemas.js';

export default async function reorderProductMedia(context: Context, params: Params<'REORDER_MEDIA'>) {
  const { modules } = context;
  const { sortKeys } = params;

  const media = await modules.products.media.updateManualOrder({ sortKeys: sortKeys as any });
  return { media: await normalizeMediaUrl(media, context) };
}
