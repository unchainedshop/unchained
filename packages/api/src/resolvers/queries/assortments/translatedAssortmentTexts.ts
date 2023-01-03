import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function translatedAssortmentTexts(
  root: Root,
  { assortmentId }: { assortmentId: string },
  { modules, userId }: Context,
) {
  log(`query translatedAssortmentTexts ${assortmentId}`, { userId });

  return modules.assortments.texts.findTexts({ assortmentId });
}
