import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';

export default async function languagesCount(
  root: Root,
  { includeInactive }: { includeInactive: boolean },
  { modules, userId }: Context
) {
  log(`query languagesCount:  ${includeInactive ? 'includeInactive' : ''}`, {
    userId,
  });

  return await modules.languages.count({
    includeInactive,
  });
}
