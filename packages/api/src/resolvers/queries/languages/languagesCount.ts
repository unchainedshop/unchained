import type { Context } from '../../../context.ts';
import type { LanguageQuery } from '@unchainedshop/core-languages';
import { log } from '@unchainedshop/logger';

export default async function languagesCount(
  root: never,
  params: LanguageQuery & { queryString?: string },
  { services, userId }: Context,
) {
  log(`query languagesCount:  ${params.includeInactive ? 'includeInactive' : ''}`, {
    userId,
  });

  const { queryString, ...query } = params;

  return services.languages.searchLanguagesCount(queryString, query);
}
