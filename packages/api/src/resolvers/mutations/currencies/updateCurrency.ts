import { Context, Root } from '@unchainedshop/types/api.js';
import { Currency } from '@unchainedshop/types/currencies.js';
import { log } from '@unchainedshop/logger';
import { CurrencyNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function updateCurrency(
  root: Root,
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
