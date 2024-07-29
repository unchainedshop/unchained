import { UnchainedCore } from '@unchainedshop/core';
import crypto from 'crypto';

export default async (
  unchainedAPI: UnchainedCore,
  username: string,
  plainSecret: string,
): Promise<void> => {
  const secret = crypto.createHash('sha256').update(`${username}:${plainSecret}`).digest('hex');

  await unchainedAPI.modules.users.updateUser(
    { username },
    {
      $set: {
        'services.token': {
          secret,
        },
      },
    } as any,
    {},
  );
};
