import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
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

  const parent = Assortments.findAssortment({
    assortmentId: parentAssortmentId,
  });

  if (!parent)
    throw new AssortmentNotFoundError({
      assortmentId: parentAssortmentId,
    });

  if (!Assortments.assortmentExists({ assortmentId: childAssortmentId }))
    throw new AssortmentNotFoundError({
      assortmentId: childAssortmentId,
    });

  return parent.addLink({
    assortmentId: childAssortmentId,
    authorId: userId,
    ...assortmentLink,
  });
}
