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

  const foundCredentials = user?.services?.web3?.find(
    (service) => service.address.toLowerCase() === address.toLowerCase(),
  );
  if (!foundCredentials) {
    throw new UserWeb3AddressNotFoundError({ userId, address });
  }

  return modules.users.updateUser(
    { _id: userId },
    {
      $pull: {
        'services.web3': { address: foundCredentials.address },
      },
    },
    {},
  );
}
