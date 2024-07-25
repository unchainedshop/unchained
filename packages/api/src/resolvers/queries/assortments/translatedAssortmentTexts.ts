import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

export default async function translatedAssortmentTexts(
  root: never,
  { assortmentId }: { assortmentId: string },
  { modules, userId }: Context,
) {
  log(`query translatedAssortmentTexts ${assortmentId}`, { userId });

  return modules.assortments.texts.findTexts({ assortmentId });
}
