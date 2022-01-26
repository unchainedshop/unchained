import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';

export default async function translatedFilterTexts(
  root: Root,
  { filterId, filterOptionValue }: { filterId: string; filterOptionValue?: string },
  { modules, userId }: Context,
) {
  log(`query translatedFilterTexts ${filterId} ${filterOptionValue || ''}`, {
    userId,
  });

  return modules.filters.texts.findTexts({ filterId, filterOptionValue });
}
