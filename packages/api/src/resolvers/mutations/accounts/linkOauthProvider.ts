import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function linkOauthProvider(
  root: Root,
  {
    provider,
    redirectUrl,
    authorizationCode,
  }: { provider: string; redirectUrl: string; authorizationCode: string },
  context: Context,
) {
  const { modules, userId, user, services } = context;

  log(`mutation linkOauthProvider ${user.username}`, {
    userId,
  });
  const oauthService = await services.accounts.oauth2({ provider, redirectUrl }, context);

  const userAuthorizationToken = await oauthService.getAuthorizationCode(authorizationCode);

  if (!userAuthorizationToken) throw new Error('Unable to authorize user');

  const userOAuthInfo = await oauthService.getAccountData(userAuthorizationToken);
  if (!userOAuthInfo || !userOAuthInfo?.email) {
    throw new Error('OAuth authentication failed');
  }
  const lowerCasedProviderName = provider.toLocaleLowerCase();

  await modules.users.updateUser(
    { _id: userId },
    {
      $push: {
        [`services.oauth.${lowerCasedProviderName}`]: {
          [userOAuthInfo.email]: {
            ...userOAuthInfo,
            userAuthorizationToken,
            authorizationCode,
          },
        },
      },
    },
    {},
  );

  return modules.users.findUserById(userId);
}
