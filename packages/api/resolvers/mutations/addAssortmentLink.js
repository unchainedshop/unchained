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

  const parent = Assortments.findOne({ _id: parentAssortmentId });
  const child = Assortments.findOne({ _id: childAssortmentId });

  if (!parent) {
    throw new AssortmentNotFoundError({
      assortmentId: parentAssortmentId,
    });
  }
  if (!child) {
    throw new AssortmentNotFoundError({
      assortmentId: childAssortmentId,
    });
  }
  return parent.addLink({
    assortmentId: childAssortmentId,
    authorId: userId,
    ...assortmentLink,
  });
}
