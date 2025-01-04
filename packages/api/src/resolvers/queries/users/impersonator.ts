import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

export default async function impersonator(
  root: never,
  params: any,
  { userId, remoteAddress, modules, impersonatorId }: Context,
) {
  log(`query impersonator ${remoteAddress}`, { userId });

  if (!impersonatorId) return null;
  return modules.users.findUserById(impersonatorId);
}
