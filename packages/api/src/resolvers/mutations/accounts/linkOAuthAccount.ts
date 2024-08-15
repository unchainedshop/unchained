import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { AuthOperationFailedError } from '../../../errors.js';

export default async function linkOAuthAccount(
  root: Root,
  {
    provider,
    redirectUrl,
    authorizationCode,
  }: { provider: string; redirectUrl: string; authorizationCode: string },
  context: Context,
) {
  const { userId, user } = context;

  log(`mutation linkOAuthAccount ${user.username}`, {
    userId,
  });
  try {
    const { modules } = context;

    const authorizationToken = await modules.accounts.oAuth2.getAuthorizationToken(
      provider,
      authorizationCode,
      redirectUrl,
    );

    if (!authorizationToken) throw new Error('Unable to authorize user');

    const { id, ...data } = await modules.accounts.oAuth2.getAccountData(provider, authorizationToken);

    await modules.users.updateUser(
      { _id: userId },
      {
        $push: {
          [`services.oauth.${provider}`]: {
            id,
            authorizationToken,
            authorizationCode,
            data,
          },
        },
      },
      { upsert: true },
    );

    return true;
  } catch {
    throw new AuthOperationFailedError({});
  }
}
