import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function tokens(
  root: never,
  {
    queryString,
    limit = 10,
    offset = 0,
  }: {
    limit: number;
    offset: number;
    queryString?: string;
  },
  { modules, userId }: Context,
) {
  log(`query tokens`, { userId });

  return modules.warehousing.findTokens({ queryString }, { limit, skip: offset });
}
