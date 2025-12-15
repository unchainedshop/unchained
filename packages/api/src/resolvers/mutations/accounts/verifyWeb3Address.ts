import { log } from '@unchainedshop/logger';
import { UserWeb3AddressNotFoundError, UserWeb3AddressSignatureError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function verifyWeb3Address(
  _root: never,
  { address, hash }: { address: string; hash: `0x${string}` },
  { modules, userId, user }: Context,
) {
  log(`mutation verifyWeb3Address ${address} ${user?.username}`, {
    userId,
  });

  const foundCredentials = modules.users.findWeb3Address(user!, address);
  if (!foundCredentials) {
    throw new UserWeb3AddressNotFoundError({ userId, address });
  }

  if (!foundCredentials.nonce) {
    throw new UserWeb3AddressSignatureError({ userId, address: foundCredentials.address });
  }

  const updatedUser = await modules.users.verifyWeb3SignatureAndUpdate(
    user!,
    { address: foundCredentials.address, nonce: foundCredentials.nonce },
    hash,
  );
  if (!updatedUser) {
    throw new UserWeb3AddressSignatureError({ userId, address: foundCredentials.address });
  }

  return updatedUser;
}
