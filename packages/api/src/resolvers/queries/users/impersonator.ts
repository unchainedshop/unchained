import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function impersonator(
  root: never,
  params: any,
  { userId, modules, impersonatorId }: Context,
) {
  log(`query impersonator`, { userId });

  if (!impersonatorId) return null;

  return modules.users.findUserById(impersonatorId);
}
