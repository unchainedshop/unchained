import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

export default async function user(
  root: never,
  params: { userId?: string },
  { modules, userId }: Context,
) {
  log(`query user ${params.userId}`, { Id: userId });
  return modules.users.findUserById(params.userId || userId);
}
