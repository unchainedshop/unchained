import type { Context } from '../../../../context.ts';
import normalizeMediaUrl from '../../../utils/normalizeMediaUrl.ts';
import type { Params } from '../schemas.ts';

export default async function reorderProductMedia(context: Context, params: Params<'REORDER_MEDIA'>) {
  const { modules } = context;
  const { sortKeys } = params;

  const media = await modules.products.media.updateManualOrder({ sortKeys: sortKeys as any });
  return { media: await normalizeMediaUrl(media, context) };
}
