import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function languages(
  root: Root,
  {
    queryString,
    limit,
    offset,
    includeInactive,
  }: { limit: number; offset: number; includeInactive: boolean; queryString: string },
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
