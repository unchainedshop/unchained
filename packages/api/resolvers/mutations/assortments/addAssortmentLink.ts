import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import {
  AssortmentFilter,
  AssortmentLink,
} from '@unchainedshop/types/assortments';

import { AssortmentNotFoundError, InvalidIdError } from '../../../errors';

export default async function addAssortmentLink(
  root: Root,
  { parentAssortmentId, childAssortmentId, ...assortmentLink }: AssortmentLink,
  { modules, userId }: Context
) {
  log(
    `mutation addAssortmentLink ${parentAssortmentId} -> ${childAssortmentId}`,
    { modules, userId }
  );
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

  return await modules.assortments.links.create(
    {
      parentAssortmentId,
      childAssortmentId,
      authorId: userId,
      ...assortmentLink,
    },
    {
      skipInvalidation: false,
    },
    userId
  );
}