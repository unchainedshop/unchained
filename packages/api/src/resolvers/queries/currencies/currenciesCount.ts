import { log } from '@unchainedshop/logger';
import type { CurrencyQuery } from '@unchainedshop/core-currencies';
import type { Context } from '../../../context.ts';

export default async function currenciesCount(
  root: never,
  params: CurrencyQuery & { queryString?: string },
  { services, userId }: Context,
) {
  log(`query currenciesCount: ${params.includeInactive ? 'includeInactive' : ''}`, {
    userId,
  });

  const { queryString, ...query } = params;

  return services.currencies.searchCurrenciesCount(queryString, query);
}
