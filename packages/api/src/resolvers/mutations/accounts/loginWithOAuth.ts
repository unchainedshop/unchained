import { Context } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

const loginWithOAuth = async (
  _,
  { provider, authorizationCode }: { provider: string; authorizationCode: string },
  context: Context,
): Promise<any | null> => {
  log(`mutation loginWithOauth ${provider} ${authorizationCode}`);

  /* const oauthAccessToken = await modules.accounts.oauth2.requestAccessToken(provider, authorizationCode);
  if (oauthAccessToken?.access_token) */
  return context.modules.accounts.loginWithService(
    {
      service: 'oauth2',
      authorizationCode,
      provider,
    },
    context,
  );
  /* return null; */
};

export default loginWithOAuth;
