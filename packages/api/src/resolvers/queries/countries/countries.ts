import { log } from 'meteor/unchained:logger';
import { Context, Root, SortOption } from '@unchainedshop/types/api';
import { CountryQuery } from '@unchainedshop/types/countries';

export default async function countries(
  root: Root,
  params: CountryQuery & { limit?: number; offset?: number; sort?: Array<SortOption> },
  { modules, userId }: Context,
) {
  log(
    `query countries: ${params.limit} ${params.offset} ${
      params.includeInactive ? 'includeInactive' : ''
    }`,
    { userId },
  );

  return modules.countries.findCountries(params);
}
