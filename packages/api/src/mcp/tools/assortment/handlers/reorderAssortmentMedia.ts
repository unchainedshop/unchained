import { Context } from '../../../../context.js';
import normalizeMediaUrl from '../../../utils/normalizeMediaUrl.js';
import { Params } from '../schemas.js';

export default async function reorderAssortmentMedia(context: Context, params: Params<'REORDER_LINKS'>) {
    const { modules } = context;
    const { sortKeys } = params;
    const media = await modules.assortments.media.updateManualOrder({ sortKeys: sortKeys as any });

    return { links: await normalizeMediaUrl(media, context) };
}
