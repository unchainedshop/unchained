import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function translatedAssortmentTexts(
  root: Root,
  { assortmentId }: { assortmentId: string },
  { modules, userId }: Context
) {
  log(`query translatedAssortmentTexts ${assortmentId}`, { modules, userId });

  return modules.assortments.texts.findTexts({ assortmentId });
}
