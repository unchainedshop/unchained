import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { CountryQuery } from '@unchainedshop/types/countries';

export default async function countries(
  root: Root,
  { limit, offset, includeInactive, queryString }: CountryQuery & { limit?: number; offset?: number },
  { modules, userId }: Context,
) {
  log(`query countries: ${limit} ${offset} ${includeInactive ? 'includeInactive' : ''}`, { userId });

  return modules.countries.findCountries({
    limit,
    offset,
    includeInactive,
    queryString,
  });
}
