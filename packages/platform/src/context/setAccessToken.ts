import { Context } from '@unchainedshop/types/api';

export default async (unchainedAPI: Context, username: string, secret: string) => {
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
