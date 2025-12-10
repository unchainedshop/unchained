import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function tokensCount(
  root: never,
  { queryString = null },
  { modules, userId }: Context,
) {
  log(`query tokensCount`, { userId });

  return modules.warehousing.tokensCount({ queryString });
}
