import { Context, Root } from '@unchainedshop/types/api';
import { Currency } from '@unchainedshop/types/currencies';
import { log } from 'meteor/unchained:logger';
import { CurrencyNotFoundError, InvalidIdError } from '../../../errors';

export default async function updateCurrency(
  root: Root,
  { currency, currencyId }: { currency: Currency; currencyId: string },
  { userId, modules }: Context,
) {
  log(`mutation updateCurrency ${currencyId}`, { userId });
  if (!currencyId) throw new InvalidIdError({ currencyId });

  if (!(await modules.currencies.currencyExists({ currencyId })))
    throw new CurrencyNotFoundError({ currencyId });

  await modules.currencies.update(currencyId, currency, userId);

  return modules.currencies.findCurrency({ currencyId });
}
