import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

export default async function reorderProductMedia(
  root: never,
  params: { sortKeys: Array<{ productMediaId: string; sortKey: number }> },
  { modules, userId }: Context,
) {
  const { sortKeys = [] } = params;

  log('mutation reorderProductMedia', { userId });

  return modules.products.media.updateManualOrder({ sortKeys });
}
