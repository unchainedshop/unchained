import type { Context } from '../../../context.ts';
import type { Currency } from '@unchainedshop/core-currencies';
import { log } from '@unchainedshop/logger';
import { CurrencyNotFoundError, InvalidIdError } from '../../../errors.ts';

export default async function updateCurrency(
  root: never,
  { currency, currencyId }: { currency: Currency; currencyId: string },
  { userId, modules }: Context,
) {
  log(`mutation updateCurrency ${currencyId}`, { userId });
  if (!currencyId) throw new InvalidIdError({ currencyId });

  if (!(await modules.currencies.currencyExists({ currencyId })))
    throw new CurrencyNotFoundError({ currencyId });

  await modules.currencies.update(currencyId, currency);

  return modules.currencies.findCurrency({ currencyId });
}
