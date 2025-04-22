import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

export default async function user(
  root: never,
  params: { userId?: string },
  { loaders, userId }: Context,
) {
  log(`query user ${params.userId}`, { Id: userId });

  return loaders.userLoader.load({ userId: params.userId || userId });
}
