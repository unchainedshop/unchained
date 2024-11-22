import { log } from '@unchainedshop/logger';
import { UserWeb3InvalidAddressError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function addWeb3Address(
  root: never,
  { address }: { address: any },
  { modules, userId, user }: Context,
) {
  log(`mutation addWeb3Address ${user.username}`, {
    userId,
  });

  if (!address) {
    throw new UserWeb3InvalidAddressError({ userId, address });
  }

  const foundAlreadyExistingEntryForAddress = user.services?.web3?.some((service) => {
    return service.address === address;
  });

  if (foundAlreadyExistingEntryForAddress) return user;

  const nonce = Math.floor(Math.random() * 1000000).toString();
  return modules.users.updateUser(
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
}
