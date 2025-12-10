import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function country(
  root: never,
  { countryId }: { countryId: string },
  { modules, userId }: Context,
) {
  log(`query country ${countryId}`, { userId });

  if (!countryId) throw new InvalidIdError({ countryId });
  return modules.countries.findCountry({ countryId });
}
