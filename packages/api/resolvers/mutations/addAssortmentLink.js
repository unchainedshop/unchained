import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { AssortmentNotFoundError } from '../../errors';

export default function (
  root,
  { parentAssortmentId, childAssortmentId, tags },
  { userId }
) {
  log(
    `mutation addAssortmentLink ${parentAssortmentId} -> ${childAssortmentId}`,
    { userId }
  );
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
  return parent.addLink({ assortmentId: childAssortmentId, tags });
}
