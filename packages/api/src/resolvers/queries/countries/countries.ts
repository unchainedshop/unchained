import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { CountryQuery } from '@unchainedshop/core-countries';
import type { Context } from '../../../context.ts';

export default async function countries(
  root: never,
  params: CountryQuery & { limit?: number; offset?: number; sort?: SortOption[]; queryString?: string },
  { services, userId }: Context,
) {
  log(
    `query countries: ${params.limit} ${params.offset} ${
      params.includeInactive ? 'includeInactive' : ''
    }`,
    { userId },
  );

  const { queryString, ...query } = params;

  return services.countries.searchCountries(queryString, query);
}
