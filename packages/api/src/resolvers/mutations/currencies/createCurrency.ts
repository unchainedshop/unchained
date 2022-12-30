import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { Currency } from '@unchainedshop/types/currencies.js';

export default async function createCurrency(
  root: Root,
  { currency }: { currency: Currency },
  { userId, modules }: Context,
) {
  log('mutation createCurrency', { userId });
  const currencyId = await modules.currencies.create({
    ...currency,
  });

  return modules.currencies.findCurrency({ currencyId });
}
