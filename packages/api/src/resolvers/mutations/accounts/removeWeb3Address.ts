import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserWeb3AddressNotFoundError } from '../../../errors';

export default async function removeWeb3Address(
  root: Root,
  { address }: { address: string },
  { modules, userId, user }: Context,
) {
  log(`mutation removeWeb3Address ${address} ${user.username}`, {
    userId,
  });

  const foundCredentials = user.services?.web3?.find(
    (service) => service.address.toLowerCase() === address.toLowerCase(),
  );
  if (!foundCredentials) {
    throw new UserWeb3AddressNotFoundError({ userId, address });
  }

  await modules.users.updateUser(
    { _id: userId },
    {
      $pull: {
        'services.web3': { address: foundCredentials.address },
      },
    },
    {},
  );

  return modules.users.findUserById(userId);
}