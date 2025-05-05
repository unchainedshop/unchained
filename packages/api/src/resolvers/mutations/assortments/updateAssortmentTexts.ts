import { log } from '@unchainedshop/logger';
import { AssortmentText } from '@unchainedshop/core-assortments';
import { InvalidIdError, AssortmentNotFoundError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function updateAssortmentTexts(
  root: never,
  { texts, assortmentId }: { texts: AssortmentText[]; assortmentId: string },
  { modules, userId }: Context,
) {
  log(`mutation updateAssortmentTexts ${assortmentId}`, { userId });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });

  if (!(await modules.assortments.assortmentExists({ assortmentId })))
    throw new AssortmentNotFoundError({ assortmentId });

  return modules.assortments.texts.updateTexts(assortmentId, texts);
}
