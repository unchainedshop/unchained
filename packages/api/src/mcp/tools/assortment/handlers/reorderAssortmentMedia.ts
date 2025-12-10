import type { Context } from '../../../../context.ts';
import normalizeMediaUrl from '../../../utils/normalizeMediaUrl.ts';
import type { Params } from '../schemas.ts';

export default async function reorderAssortmentMedia(context: Context, params: Params<'REORDER_LINKS'>) {
  const { modules } = context;
  const { sortKeys } = params;
  const media = await modules.assortments.media.updateManualOrder({ sortKeys: sortKeys as any });

  return { links: await normalizeMediaUrl(media, context) };
}
