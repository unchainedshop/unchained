import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function translatedAssortmentTexts(
  root: never,
  { assortmentId }: { assortmentId: string },
  { modules, userId }: Context,
) {
  log(`query translatedAssortmentTexts ${assortmentId}`, { userId });

  return modules.assortments.texts.findTexts({ assortmentId });
}
