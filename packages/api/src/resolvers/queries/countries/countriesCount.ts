import { Context, Root } from '@unchainedshop/types/api';
import { CountryQuery } from '@unchainedshop/types/countries';
import { log } from 'meteor/unchained:logger';

export default async function countriesCount(
  root: Root,
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
