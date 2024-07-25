import { Context } from '../../../types.js';
import { log } from '@unchainedshop/logger';
import { CurrencyNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function removeCurrency(
  root: never,
  { currencyId }: { currencyId: string },
  { userId, modules }: Context,
) {
  log(`mutation removeCurrency ${currencyId}`, { userId });

  if (!currencyId) throw new InvalidIdError({ currencyId });

  if (!(await modules.currencies.currencyExists({ currencyId })))
    throw new CurrencyNotFoundError({ currencyId });

  await modules.currencies.delete(currencyId);

  return modules.currencies.findCurrency({ currencyId });
}
