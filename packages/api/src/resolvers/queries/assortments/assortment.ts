import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { InvalidIdError } from '../../../errors.js';

export default async function assortment(
  root: Root,
  { assortmentId, slug }: { assortmentId?: string; slug?: string },
  { modules, userId }: Context,
) {
  log(`query assortment ${assortmentId} ${slug}`, { userId });

  if (!assortmentId === !slug) throw new InvalidIdError({ assortmentId, slug });

  return modules.assortments.findAssortment({
    assortmentId,
    slug,
  });
}
