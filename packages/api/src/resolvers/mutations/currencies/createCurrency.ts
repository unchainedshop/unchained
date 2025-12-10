import { log } from '@unchainedshop/logger';
import type { Currency } from '@unchainedshop/core-currencies';
import type { Context } from '../../../context.ts';

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
