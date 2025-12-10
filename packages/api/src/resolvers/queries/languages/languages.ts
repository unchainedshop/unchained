import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { LanguageQuery } from '@unchainedshop/core-languages';
import type { Context } from '../../../context.ts';

export default async function languages(
  root: never,
  params: LanguageQuery & { limit: number; offset: number; sort?: SortOption[] },
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
