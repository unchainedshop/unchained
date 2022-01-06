import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';

export default async function countriesCount(
  root: Root,
  { includeInactive }: { includeInactive: boolean },
  { modules, userId }: Context
) {
  log(`query countriesCount:  ${includeInactive ? 'includeInactive' : ''}`, {
    userId,
  });
  
  return modules.countries.count({ includeInactive });
}
