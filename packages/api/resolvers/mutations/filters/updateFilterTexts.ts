import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { FilterNotFoundError, InvalidIdError } from '../../../errors';

export default async function updateFilterTexts(
  root: Root,
  params: {
    texts: Array<{ locale: string; title?: string; subtitle?: string }>;
    filterId: string;
    filterOptionValue?: string;
  },
  { modules, userId }: Context,
) {
  const { texts, filterId, filterOptionValue } = params;

  log(`mutation updateFilterTexts ${filterId} ${filterOptionValue}`, {
    userId,
  });

  if (!filterId) throw new InvalidIdError({ filterId });

  const filter = await modules.filters.findFilter({ filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });

  return modules.filters.texts.updateTexts({ filterId, filterOptionValue }, texts, userId);
}
