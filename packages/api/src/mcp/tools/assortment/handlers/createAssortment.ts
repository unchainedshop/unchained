import type { Context } from '../../../../context.ts';
import type { Assortment, AssortmentText } from '@unchainedshop/core-assortments';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.ts';
import type { Params } from '../schemas.ts';

export default async function createAssortment(context: Context, params: Params<'CREATE'>) {
  const { modules } = context;
  const { assortment, texts } = params;

  const newAssortment = await modules.assortments.create(assortment as Assortment);

  if (texts && texts.length > 0)
    await modules.assortments.texts.updateTexts(newAssortment._id, texts as unknown as AssortmentText[]);

  return {
    assortment: await getNormalizedAssortmentDetails({ assortmentId: newAssortment._id }, context),
  };
}
