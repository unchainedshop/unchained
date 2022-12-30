import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { InvalidIdError } from '../../../errors.js';

export default async function country(
  root: Root,
  { countryId }: { countryId: string },
  { modules, userId }: Context,
) {
  log(`query country ${countryId}`, { userId });

  if (!countryId) throw new InvalidIdError({ countryId });
  return modules.countries.findCountry({ countryId });
}
