import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { AssortmentNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeAssortment(
  root: Root,
  { assortmentId }: { assortmentId: string },
  { modules, userId }: Context
) {
  log(`mutation removeAssortment ${assortmentId}`, { modules, userId });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });

  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  await modules.assortments.delete(
    assortmentId,
    { skipInvalidation: false },
    userId
  );

  return assortment;
}
