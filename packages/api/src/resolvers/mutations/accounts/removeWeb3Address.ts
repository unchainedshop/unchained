import { log } from '@unchainedshop/logger';
import { UserWeb3AddressNotFoundError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function removeWeb3Address(
  root: never,
  { address }: { address: string },
  { modules, userId, user }: Context,
) {
  log(`mutation removeWeb3Address ${address} ${user?.username}`, {
    userId,
  });

  const updatedUser = await modules.users.removeWeb3Address(userId!, address);

  if (!updatedUser) {
    throw new UserWeb3AddressNotFoundError({ userId, address });
  }

  return updatedUser;
}
