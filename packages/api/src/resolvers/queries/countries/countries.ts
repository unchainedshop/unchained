import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/utils';
import { CountryQuery } from '@unchainedshop/types/countries.js';
import { Context } from '../../../types.js';

export default async function countries(
  root: never,
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
