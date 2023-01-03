import { Context, Root } from '@unchainedshop/types/api.js';
import { LanguageQuery } from '@unchainedshop/types/languages.js';
import { log } from '@unchainedshop/logger';

export default async function languagesCount(
  root: Root,
  params: LanguageQuery,
  { modules, userId }: Context,
) {
  log(`query languagesCount:  ${params.includeInactive ? 'includeInactive' : ''}`, {
    userId,
  });

  return modules.languages.count(params);
}
