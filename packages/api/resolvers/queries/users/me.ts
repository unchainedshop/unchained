import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function me(root: Root, params: any, { userId, user, remoteAddress }: Context) {
  log(`query me ${remoteAddress}`, { userId });

  return user;
}
