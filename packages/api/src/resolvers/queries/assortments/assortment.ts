import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { InvalidIdError } from '../../../errors.ts';

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
