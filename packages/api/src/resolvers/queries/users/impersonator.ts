import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

export default async function impersonator(
  root: never,
  params: any,
  { userId, modules, impersonatorId }: Context,
) {
  log(`query impersonator`, { userId });

  if (!impersonatorId) return null;

  return modules.users.findUser({ userId: impersonatorId });
}
