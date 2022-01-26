import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';

export default async function currencies(
  root: Root,
  {
    limit,
    offset,
    includeInactive,
  }: { limit: number; offset: number; includeInactive: boolean },
  { modules, userId }: Context
) {
  log(
    `query currencies: ${limit} ${offset} ${
      includeInactive ? 'includeInactive' : ''
    }`,
    { userId }
  );
  return modules.currencies.findCurrencies({
    limit,
    offset,
    includeInactive,
  });
}
