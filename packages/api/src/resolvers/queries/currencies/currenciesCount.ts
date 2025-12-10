import { log } from '@unchainedshop/logger';
import type { CurrencyQuery } from '@unchainedshop/core-currencies';
import type { Context } from '../../../context.ts';

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
