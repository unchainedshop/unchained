import type { UnchainedCore } from '@unchainedshop/core';
import { sha256 } from '@unchainedshop/utils';

export default async (
  unchainedAPI: UnchainedCore,
  username: string,
  plainSecret: string,
): Promise<void> => {
  const secret = await sha256(`${username}:${plainSecret}`);

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
