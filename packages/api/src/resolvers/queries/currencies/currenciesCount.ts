import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api';
import { CurrencyQuery } from '@unchainedshop/types/currencies';

export default async function currenciesCount(
  root: Root,
  params: CurrencyQuery,
  { modules, userId }: Context,
) {
  log(`query currenciesCount: ${params.includeInactive ? 'includeInactive' : ''}`, {
    userId,
  });

  return modules.currencies.count(params);
}
