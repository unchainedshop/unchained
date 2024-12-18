import { log } from '@unchainedshop/logger';
import { UserWeb3AddressNotFoundError, UserWeb3AddressSignatureError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function verifyWeb3Address(
  root: never,
  { address, hash }: { address: string; hash: string },
  { modules, userId, user }: Context,
) {
  log(`mutation verifyWeb3Address ${address} ${user.username}`, {
    userId,
  });

  const foundCredentials = user.services?.web3?.find(
    (service) => service.address.toLowerCase() === address.toLowerCase(),
  );
  if (!foundCredentials) {
    throw new UserWeb3AddressNotFoundError({ userId, address });
  }

  const msg = `0x${Buffer.from(foundCredentials.nonce, 'utf8').toString('hex')}`;

  // eslint-disable-next-line
  // @ts-ignore
  const { recoverPersonalSignature } = await import('@metamask/eth-sig-util');

  const recoveredAddr = recoverPersonalSignature({
    data: msg,
    signature: hash,
  });

  const signatureCorrectForAddress =
    recoveredAddr.toLowerCase() === foundCredentials.address.toLowerCase();

  if (!signatureCorrectForAddress) {
    throw new UserWeb3AddressSignatureError({ userId, address: foundCredentials.address });
  }

  const web3Services: any[] = user.services.web3.map((service) => {
    if (foundCredentials.address === service.address) {
      return {
        ...service,
        nonce: undefined,
        verified: true,
      };
    }
    return service;
  });

  return modules.users.updateUser(
    { _id: userId },
    {
      $set: {
        // eslint-disable-next-line
        // @ts-ignore
        'services.web3': web3Services,
      },
    },
    {},
  );
}
