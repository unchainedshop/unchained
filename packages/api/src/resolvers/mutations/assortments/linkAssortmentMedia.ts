import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.ts';

export default async function linkAssortmentMedia(
  root: never,
  { assortmentId, mediaId }: { assortmentId: string; mediaId: string },
  { modules, userId }: Context,
) {
  log('mutation linkAssortmentMedia', { assortmentId, mediaId, userId });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });
  if (!mediaId) throw new InvalidIdError({ mediaId });

  return modules.assortments.media.create({ assortmentId, mediaId });
}
