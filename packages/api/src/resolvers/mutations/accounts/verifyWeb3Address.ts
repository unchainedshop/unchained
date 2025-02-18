import { log } from '@unchainedshop/logger';
import { UserWeb3AddressNotFoundError, UserWeb3AddressSignatureError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function verifyWeb3Address(
  root: never,
  { address, hash }: { address: string; hash: `0x${string}` },
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

  // eslint-disable-next-line
  // @ts-ignore
  const { bufferToHex, fromRpcSig, ecrecover, toBuffer, hashPersonalMessage, publicToAddress } =
    await import('@ethereumjs/util');

  const message = `0x${Buffer.from(foundCredentials.nonce, 'utf8').toString('hex')}`;
  const messageHash = hashPersonalMessage(toBuffer(message));

  const sigParams = fromRpcSig(hash);
  const publicKey = ecrecover(messageHash, sigParams.v, sigParams.r, sigParams.s);

  const sender = publicToAddress(publicKey);
  const recoveredAddr = bufferToHex(sender);

  const isSignatureCorrectForAddress =
    recoveredAddr.toLowerCase() === foundCredentials.address.toLowerCase();

  if (!isSignatureCorrectForAddress) {
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
