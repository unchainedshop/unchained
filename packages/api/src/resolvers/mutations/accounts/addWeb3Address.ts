import { log } from '@unchainedshop/logger';
import { UserWeb3InvalidAddressError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function addWeb3Address(
  root: never,
  { address }: { address: string },
  { modules, userId, user }: Context,
) {
  log(`mutation addWeb3Address ${user!.username}`, {
    userId,
  });

  if (!address) {
    throw new UserWeb3InvalidAddressError({ userId, address });
  }

  return modules.users.addWeb3Address(userId!, address);
}
