import type { Context } from '../../../context.ts';
import type { CountryQuery } from '@unchainedshop/core-countries';
import { log } from '@unchainedshop/logger';

export default async function countriesCount(
  root: never,
  params: CountryQuery & { queryString?: string },
  { services, userId }: Context,
) {
  log(
    `query countriesCount:  ${params.includeInactive ? 'includeInactive' : ''} queryString: ${
      params.queryString
    }`,
    {
      userId,
    },
  );

  const { queryString, ...query } = params;

  return services.countries.searchCountriesCount(queryString, query);
}
