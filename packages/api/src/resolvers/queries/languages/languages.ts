import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/utils';
import { LanguageQuery } from '@unchainedshop/core-languages';
import { Context } from '../../../context.js';

export default async function languages(
  root: never,
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
