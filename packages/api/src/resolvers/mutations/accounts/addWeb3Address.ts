import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserWeb3InvalidAddressError } from '../../../errors';

export default async function addWeb3Address(
  root: Root,
  { address }: { address: any },
  { modules, userId, user }: Context,
) {
  log(`mutation addWeb3Address ${user.username}`, {
    userId,
  });

  if (!address) {
    throw new UserWeb3InvalidAddressError({ userId, address });
  }

  const nonce = Math.floor(Math.random() * 1000000).toString();
  await modules.users.updateUser(
    { _id: userId },
    {
      $push: {
        'services.web3': {
          address,
          nonce,
        },
      },
    },
    {},
  );

  return modules.users.findUserById(userId);
}
