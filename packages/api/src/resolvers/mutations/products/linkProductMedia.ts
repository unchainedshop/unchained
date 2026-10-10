import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.ts';

export default async function linkProductMedia(
  root: never,
  { productId, mediaId }: { productId: string; mediaId: string },
  { modules, userId }: Context,
) {
  log('mutation linkProductMedia', { productId, mediaId, userId });

  if (!productId) throw new InvalidIdError({ productId });
  if (!mediaId) throw new InvalidIdError({ mediaId });

  return modules.products.media.create({ productId, mediaId });
}
