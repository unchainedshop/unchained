import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function me(root: never, params: any, { userId, user }: Context) {
  log(`query me`, { userId });

  return user;
}
