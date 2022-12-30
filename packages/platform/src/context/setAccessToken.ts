import { UnchainedCore } from '@unchainedshop/types/core.js';

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
