import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function tokensCount(
  root: never,
  { queryString }: { queryString?: string },
  { services, userId }: Context,
) {
  log(`query tokensCount`, { userId });

  return services.warehousing.searchTokensCount(queryString, {});
}
