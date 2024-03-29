import { log } from '@unchainedshop/logger';
import { Context, Root, SortOption } from '@unchainedshop/types/api.js';
import { CountryQuery } from '@unchainedshop/types/countries.js';

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
