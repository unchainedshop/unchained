import type { Context } from '../../../../context.ts';
import { AssortmentNotFoundError, CyclicAssortmentLinkNotSupportedError } from '../../../../errors.ts';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.ts';
import type { Params } from '../schemas.ts';

export default async function addAssortmentLink(context: Context, params: Params<'ADD_LINK'>) {
  const { modules } = context;
  const { parentAssortmentId, childAssortmentId, tags } = params;

  const parentAssortment = await modules.assortments.findAssortment({
    assortmentId: parentAssortmentId,
  });
  if (!parentAssortment) throw new AssortmentNotFoundError({ assortmentId: parentAssortmentId });

  const childAssortment = await modules.assortments.findAssortment({
    assortmentId: childAssortmentId,
  });
  if (!childAssortment) throw new Error(`Child assortment not found: ${childAssortmentId}`);

  try {
    await modules.assortments.links.create({
      parentAssortmentId,
      childAssortmentId,
      tags,
    } as any);
    return {
      assortment: await getNormalizedAssortmentDetails({ assortmentId: parentAssortmentId }, context),
    };
  } catch (e) {
    if (e?.message === 'CyclicGraphNotSupported')
      throw new CyclicAssortmentLinkNotSupportedError({ parentAssortmentId, childAssortmentId });
    throw e;
  }
}
