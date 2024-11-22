import { log } from '@unchainedshop/logger';
import { Assortment, AssortmentText } from '@unchainedshop/core-assortments';
import { Context } from '../../../context.js';

export default async function createAssortment(
  root: never,
  {
    texts,
    assortment: assortmentData,
  }: {
    assortment: Assortment;
    texts?: AssortmentText[];
  },
  { modules, userId }: Context,
) {
  log('mutation createAssortment', { userId });

  const assortment = await modules.assortments.create({
    ...assortmentData,
  });

  if (texts) {
    await modules.assortments.texts.updateTexts(assortment._id, texts);
  }

  return assortment;
}
