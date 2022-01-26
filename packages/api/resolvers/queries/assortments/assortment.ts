import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { InvalidIdError } from '../../../errors';

export default async function assortment(
  root: Root,
  { assortmentId, slug }: { assortmentId?: string; slug?: string },
  { modules, userId }: Context,
) {
  log(`query assortment ${assortmentId} ${slug}`, { modules, userId });

  if (!assortmentId === !slug) throw new InvalidIdError({ assortmentId, slug });

  return modules.assortments.findAssortment({
    assortmentId,
    slug,
  });
}
