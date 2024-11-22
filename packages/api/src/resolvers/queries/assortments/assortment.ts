import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { InvalidIdError } from '../../../errors.js';

export default async function assortment(
  root: never,
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
