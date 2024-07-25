import { log } from '@unchainedshop/logger';
import { Currency } from '@unchainedshop/types/currencies.js';
import { Context } from '../../../types.js';

export default async function createCurrency(
  root: never,
  { currency }: { currency: Currency },
  { userId, modules }: Context,
) {
  log('mutation createCurrency', { userId });
  const currencyId = await modules.currencies.create({
    ...currency,
  });

  return modules.currencies.findCurrency({ currencyId });
}
