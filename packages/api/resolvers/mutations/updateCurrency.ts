import { log } from 'meteor/unchained:logger';
import { CurrencyNotFoundError, InvalidIdError } from '../../errors';
import { Root, Context } from '@unchainedshop/types/api';
import { Currency } from '@unchainedshop/types/currencies';

export default async function updateCurrency(
  root: Root,
  { currency, currencyId }: { currency: Currency; currencyId: string },
  { userId, modules }: Context
) {
  log(`mutation updateCurrency ${currencyId}`, { userId });
  if (!currencyId) throw new InvalidIdError({ currencyId });

  const currencyExists = await modules.currencies.currencyExists({
    currencyId,
  });
  if (!currencyExists) throw new CurrencyNotFoundError({ currencyId });

  await modules.currencies.update(currencyId, currency);
  return modules.currencies.findCurrency({ currencyId });
}
