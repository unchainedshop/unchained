import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { CurrencyQuery } from '@unchainedshop/types/currencies';

export default async function currenciesCount(
  root: Root,
  { includeInactive, queryString }: CurrencyQuery,
  { modules, userId }: Context,
) {
  log(`query currenciesCount: ${includeInactive ? 'includeInactive' : ''}`, {
    userId,
  });

  return modules.currencies.count({ includeInactive, queryString });
}
