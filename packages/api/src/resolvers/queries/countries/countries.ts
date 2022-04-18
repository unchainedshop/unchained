import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function countries(
  root: Root,
  {
    limit,
    offset,
    includeInactive,
    queryString,
  }: { limit: number; offset: number; includeInactive: boolean; queryString: string },
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
