import { Context, Root } from '@unchainedshop/types/api';
import { AssortmentLink } from '@unchainedshop/types/assortments';
import { log } from 'meteor/unchained:logger';
import { AssortmentNotFoundError, InvalidIdError } from '../../../errors';

export default async function addAssortmentLink(
  root: Root,
  { parentAssortmentId, childAssortmentId, ...assortmentLink }: AssortmentLink,
  { modules, userId }: Context,
) {
  log(`mutation addAssortmentLink ${parentAssortmentId} -> ${childAssortmentId}`, { userId });
  if (!parentAssortmentId) throw new InvalidIdError({ parentAssortmentId });
  if (!childAssortmentId) throw new InvalidIdError({ childAssortmentId });

  if (
    !(await modules.assortments.assortmentExists({
      assortmentId: parentAssortmentId,
    }))
  )
    throw new AssortmentNotFoundError({
      assortmentId: parentAssortmentId,
    });

  if (
    !(await modules.assortments.assortmentExists({
      assortmentId: childAssortmentId,
    }))
  )
    throw new AssortmentNotFoundError({
      assortmentId: childAssortmentId,
    });

  return modules.assortments.links.create(
    {
      parentAssortmentId,
      childAssortmentId,
      authorId: userId,
      ...assortmentLink,
    },
    {
      skipInvalidation: false,
    },
    userId,
  );
}
