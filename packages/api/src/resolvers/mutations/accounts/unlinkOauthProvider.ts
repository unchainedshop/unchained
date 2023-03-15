import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function unlinkOauthProvider(
  root: Root,
  { provider, email }: { provider: string; email: string },
  context: Context,
) {
  const { modules, userId, user } = context;

  log(`mutation unlinkOauthProvider ${user.username}`, {
    userId,
  });

  const lowerCasedProviderName = provider.toLocaleLowerCase();

  await modules.users.updateUser(
    { _id: userId },
    {
      $pull: {
        [`services.oauth.${lowerCasedProviderName}.${email}`]: {
          $exists: true,
        },
      },
    },
    {},
  );

  return modules.users.findUserById(userId);
}
