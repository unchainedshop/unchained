import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { Assortment, AssortmentText } from '@unchainedshop/types/assortments.js';

export default async function createAssortment(
  root: Root,
  {
    texts,
    ...assortmentData
  }: Assortment & {
    texts: AssortmentText[];
  },
  { modules, userId }: Context,
) {
  log('mutation createAssortment', { userId });

  const assortment = await modules.assortments.create({
    ...assortmentData,
  });

  if (texts) {
    modules.assortments.texts.updateTexts(assortment._id, texts);
  }

  return assortment;
}
