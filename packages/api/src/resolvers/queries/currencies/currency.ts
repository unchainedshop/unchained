import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { InvalidIdError } from '../../../errors';

export default async function currency(
  root: Root,
  { currencyId }: { currencyId: string },
  { modules, userId }: Context,
) {
  log(`query currency ${currencyId}`, { userId });

  if (!currencyId) throw new InvalidIdError({ currencyId });

  return modules.currencies.findCurrency({ currencyId });
}
