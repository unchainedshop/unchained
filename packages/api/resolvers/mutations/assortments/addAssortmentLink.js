import { log } from 'meteor/unchained:logger';
import {
  Assortments,
  AssortmentLinks,
} from 'meteor/unchained:core-assortments';
import { AssortmentNotFoundError, InvalidIdError } from '../../errors';

export default function addAssortmentLink(
  root,
  { parentAssortmentId, childAssortmentId, ...assortmentLink },
  { userId }
) {
  log(
    `mutation addAssortmentLink ${parentAssortmentId} -> ${childAssortmentId}`,
    { userId }
  );
  if (!parentAssortmentId) throw new InvalidIdError({ parentAssortmentId });
  if (!childAssortmentId) throw new InvalidIdError({ childAssortmentId });

  if (!Assortments.assortmentExists({ assortmentId: parentAssortmentId }))
    throw new AssortmentNotFoundError({
      assortmentId: parentAssortmentId,
    });

  if (!Assortments.assortmentExists({ assortmentId: childAssortmentId }))
    throw new AssortmentNotFoundError({
      assortmentId: childAssortmentId,
    });

  return AssortmentLinks.createAssortmentLink({
    parentAssortmentId,
    childAssortmentId,
    authorId: userId,
    ...assortmentLink,
  });
}
