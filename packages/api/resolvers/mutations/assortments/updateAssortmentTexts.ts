import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { InvalidIdError, AssortmentNotFoundError } from '../../../errors';
import { AssortmentText } from '@unchainedshop/types/assortments';

export default async function updateAssortmentTexts(
  root: Root,
  {
    texts,
    assortmentId,
  }: { texts: Array<AssortmentText>; assortmentId: string },
  { modules, userId }: Context
) {
  log(`mutation updateAssortmentTexts ${assortmentId}`, { modules, userId });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });

  if (!(await modules.assortments.assortmentExists({ assortmentId })))
    throw new AssortmentNotFoundError({ assortmentId });

  return await modules.assortments.texts.updateTexts(
    assortmentId,
    texts,
    userId
  );
}
