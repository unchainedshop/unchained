import { Context } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

const loginWithOAuth = async (
  _,
  {
    provider,
    authorizationCode,
    redirectURL,
  }: { provider: string; authorizationCode: string; redirectURL: string },
  context: Context,
): Promise<any | null> => {
  log(`mutation loginWithOauth ${provider} ${authorizationCode}`);

  return context.modules.accounts.loginWithService(
    {
      service: 'oauth2',
      authorizationCode,
      provider,
      redirectURL,
    },
    context,
  );
  /* return null; */
};

export default loginWithOAuth;
