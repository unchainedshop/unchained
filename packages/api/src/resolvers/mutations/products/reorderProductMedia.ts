import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

export default async function reorderProductMedia(
  root: never,
  params: { sortKeys: { productMediaId: string; sortKey: number }[] },
  { modules, userId }: Context,
) {
  const { sortKeys = [] } = params;

  log('mutation reorderProductMedia', { userId });

  return modules.products.media.updateManualOrder({ sortKeys });
}
