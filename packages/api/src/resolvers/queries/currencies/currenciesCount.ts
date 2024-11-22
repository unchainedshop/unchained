import { log } from '@unchainedshop/logger';
import { CurrencyQuery } from '@unchainedshop/core-currencies';
import { Context } from '../../../context.js';

export default async function currenciesCount(
  root: never,
  params: CurrencyQuery,
  { modules, userId }: Context,
) {
  log(`query currenciesCount: ${params.includeInactive ? 'includeInactive' : ''}`, {
    userId,
  });

  return modules.currencies.count(params);
}
