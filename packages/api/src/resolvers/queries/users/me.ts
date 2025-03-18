import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

export default async function me(root: never, params: any, { userId, user }: Context) {
  log(`query me`, { userId });

  return user;
}
