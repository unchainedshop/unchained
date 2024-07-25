import { Context } from '../../../types.js';
import { CountryQuery } from '@unchainedshop/types/countries.js';
import { log } from '@unchainedshop/logger';

export default async function countriesCount(
  root: never,
  params: CountryQuery,
  { modules, userId }: Context,
) {
  log(
    `query countriesCount:  ${params.includeInactive ? 'includeInactive' : ''} queryString: ${
      params.queryString
    }`,
    {
      userId,
    },
  );

  return modules.countries.count(params);
}
