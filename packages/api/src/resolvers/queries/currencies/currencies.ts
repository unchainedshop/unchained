import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { CurrencyQuery } from '@unchainedshop/core-currencies';
import type { Context } from '../../../context.ts';

export default async function currencies(
  root: never,
  params: CurrencyQuery & { limit: number; offset: number; sort?: SortOption[]; queryString?: string },
  { services, userId }: Context,
) {
  log(
    `query currencies: ${params.limit} ${params.offset} ${
      params.includeInactive ? 'includeInactive' : ''
    }`,
    { userId },
  );

  const { queryString, ...query } = params;

  return services.currencies.searchCurrencies(queryString, query);
}
