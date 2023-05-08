import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function unlinkOAuthAccount(
  root: Root,
  { provider, oAuthAccountId }: { provider: string; oAuthAccountId: string },
  context: Context,
) {
  const { modules, userId } = context;

  log(`mutation unlinkOAuthAccount ${provider} ${oAuthAccountId}`, {
    userId,
  });

  await modules.users.updateUser(
    { _id: userId },
    {
      $pull: {
        [`services.oauth.${provider}`]: { id: oAuthAccountId },
      },
    },
    { upsert: true },
  );

  return modules.users.findUserById(userId);
}
