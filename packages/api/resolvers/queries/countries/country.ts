import { log } from 'meteor/unchained:logger';
import { InvalidIdError } from '../../errors';
import { Root, Context } from '@unchainedshop/types/api';

export default async function country(
  root: Root,
  { countryId }: { countryId: string },
  { modules, userId }: Context
) {
  log(`query country ${countryId}`, { userId });

  if (!countryId) throw new InvalidIdError({ countryId });
  return modules.countries.findCountry({ countryId });
}
