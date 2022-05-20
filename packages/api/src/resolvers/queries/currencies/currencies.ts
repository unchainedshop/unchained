import { log } from 'meteor/unchained:logger';
import { Root, Context, SortOption } from '@unchainedshop/types/api';
import { CurrencyQuery } from '@unchainedshop/types/currencies';

export default async function currencies(
  root: Root,
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
