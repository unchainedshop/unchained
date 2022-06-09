import { log } from 'meteor/unchained:logger';
import { Context, Root, SortOption } from '@unchainedshop/types/api';
import { LanguageQuery } from '@unchainedshop/types/languages';

export default async function languages(
  root: Root,
  params: LanguageQuery & { limit: number; offset: number; sort?: Array<SortOption> },
  { modules, userId }: Context,
) {
  log(
    `query languages: ${params.limit} ${params.offset} ${
      params.includeInactive ? 'includeInactive' : ''
    }`,
    { userId },
  );

  return modules.languages.findLanguages(params);
}
