import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

export default async function me(root: never, params: any, { userId, user, remoteAddress }: Context) {
  log(`query me ${remoteAddress}`, { userId });

  return user;
}
