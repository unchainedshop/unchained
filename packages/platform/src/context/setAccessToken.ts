import { UnchainedCore } from '@unchainedshop/types/core';

export default async (unchainedAPI: UnchainedCore, username: string, secret: string): Promise<void> => {
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
