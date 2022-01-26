import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';

export default async function currenciesCount(
  root: Root,
  { includeInactive }: { includeInactive: boolean },
  { modules, userId }: Context,
) {
  log(`query currenciesCount: ${includeInactive ? 'includeInactive' : ''}`, {
    userId,
  });

  return modules.currencies.count({ includeInactive });
}
