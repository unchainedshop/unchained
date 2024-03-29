import { log } from '@unchainedshop/logger';
import { Context, Root, SortOption } from '@unchainedshop/types/api.js';
import { LanguageQuery } from '@unchainedshop/types/languages.js';

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
