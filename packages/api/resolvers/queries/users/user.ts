import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function user(
  root: Root,
  params: { userId?: string },
  { modules, userId }: Context
) {
  log(`query user ${params.userId}`, { Id: userId });
  return await modules.users.findUser({ userId: params.userId || userId });
}
