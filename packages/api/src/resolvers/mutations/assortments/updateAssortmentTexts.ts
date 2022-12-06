import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { AssortmentText } from '@unchainedshop/types/assortments';
import { InvalidIdError, AssortmentNotFoundError } from '../../../errors';

export default async function updateAssortmentTexts(
  root: Root,
  { texts, assortmentId }: { texts: Array<AssortmentText>; assortmentId: string },
  { modules, userId }: Context,
) {
  log(`mutation updateAssortmentTexts ${assortmentId}`, { userId });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });

  if (!(await modules.assortments.assortmentExists({ assortmentId })))
    throw new AssortmentNotFoundError({ assortmentId });

  return modules.assortments.texts.updateTexts(assortmentId, texts);
}
