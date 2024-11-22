import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

export default async function translatedFilterTexts(
  root: never,
  { filterId, filterOptionValue }: { filterId: string; filterOptionValue?: string },
  { modules, userId }: Context,
) {
  log(`query translatedFilterTexts ${filterId} ${filterOptionValue || ''}`, {
    userId,
  });

  return modules.filters.texts.findTexts({
    filterId,
    filterOptionValue: filterOptionValue || null,
  });
}
