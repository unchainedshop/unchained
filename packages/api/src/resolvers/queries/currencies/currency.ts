import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function currency(
  root: never,
  { currencyId }: { currencyId: string },
  { modules, userId }: Context,
) {
  log(`query currency ${currencyId}`, { userId });

  if (!currencyId) throw new InvalidIdError({ currencyId });

  return modules.currencies.findCurrency({ currencyId });
}
