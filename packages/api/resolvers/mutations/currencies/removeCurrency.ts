import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import { CurrencyNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeCurrency(
  root: Root,
  { currencyId }: { currencyId: string },
  { userId, modules }: Context
) {
  log(`mutation removeCurrency ${currencyId}`, { userId });
  if (!currencyId) throw new InvalidIdError({ currencyId });
  const currency = await modules.currencies.findCurrency({ currencyId });
  if (!currency) throw new CurrencyNotFoundError({ currencyId });

  await modules.currencies.delete(currencyId, userId);
  return currency;
}
