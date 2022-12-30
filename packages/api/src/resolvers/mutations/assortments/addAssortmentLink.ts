import { Context, Root } from '@unchainedshop/types/api.js';
import { AssortmentLink } from '@unchainedshop/types/assortments.js';
import { log } from '@unchainedshop/logger';
import {
  AssortmentNotFoundError,
  CyclicAssortmentLinkNotSupportedError,
  InvalidIdError,
} from '../../../errors.js';

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
  try {
    const result = await modules.assortments.links.create(
      {
        parentAssortmentId,
        childAssortmentId,
        ...assortmentLink,
      },
      {
        skipInvalidation: false,
      },
    );
    return result;
  } catch (e) {
    if (e?.message === 'CyclicGraphNotSupported')
      throw new CyclicAssortmentLinkNotSupportedError({ parentAssortmentId, childAssortmentId });
    throw e;
  }
}
