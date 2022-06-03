import { Context, Root } from '@unchainedshop/types/api';
import { LanguageQuery } from '@unchainedshop/types/languages';
import { log } from 'meteor/unchained:logger';

export default async function languagesCount(
  root: Root,
  { includeInactive, queryString }: LanguageQuery,
  { modules, userId }: Context,
) {
  log(`query languagesCount:  ${includeInactive ? 'includeInactive' : ''}`, {
    userId,
  });

  return modules.languages.count({
    includeInactive,
    queryString,
  });
}
