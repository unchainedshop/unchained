import { log } from '@unchainedshop/logger';
import type { Currency } from '@unchainedshop/core-currencies';
import type { Context } from '../../../context.ts';
import { CurrencyDecimalsError } from '../../../errors.ts';

export default async function createCurrency(
  root: never,
  { currency }: { currency: Currency },
  { userId, modules }: Context,
) {
  log('mutation createCurrency', { userId });
  try {
    const currencyId = await modules.currencies.create({
      ...currency,
    });
    return modules.currencies.findCurrency({ currencyId });
  } catch (error) {
    if (!String(error.cause).startsWith('CURRENCY_DECIMALS')) throw error;
    throw new CurrencyDecimalsError({ message: error.message, reason: error.cause });
  }
}
