import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

export default async function tokensCount(
  root: never,
  { queryString = null },
  { modules, userId }: Context,
) {
  log(`query tokensCount`, { userId });

  return modules.warehousing.tokensCount({ queryString });
}
