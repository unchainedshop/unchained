import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { LanguageQuery } from '@unchainedshop/types/languages';

export default async function languages(
  root: Root,
  { queryString, limit, offset, includeInactive }: LanguageQuery & { limit: number; offset: number },
  { modules, userId }: Context,
) {
  log(`query languages: ${limit} ${offset} ${includeInactive ? 'includeInactive' : ''}`, { userId });

  return modules.languages.findLanguages({
    limit,
    offset,
    includeInactive,
    queryString,
  });
}
