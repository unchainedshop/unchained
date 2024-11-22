import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/utils';
import { CurrencyQuery } from '@unchainedshop/core-currencies';
import { Context } from '../../../context.js';

export default async function currencies(
  root: never,
  params: CurrencyQuery & { limit: number; offset: number; sort?: Array<SortOption> },
  { modules, userId }: Context,
) {
  log(
    `query currencies: ${params.limit} ${params.offset} ${
      params.includeInactive ? 'includeInactive' : ''
    }`,
    { userId },
  );
  return modules.currencies.findCurrencies(params);
}
