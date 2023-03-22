import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { AuthOperationFailedError, EmailAlreadyExistsError } from '../../../errors.js';

export default async function linkOAuthProvider(
  root: Root,
  {
    provider,
    redirectUrl,
    authorizationCode,
  }: { provider: string; redirectUrl: string; authorizationCode: string },
  context: Context,
) {
  const { userId, user } = context;

  log(`mutation linkOAuthProvider ${user.username}`, {
    userId,
  });
  try {
    const { services } = context;

    const oauth2Service = await services.accounts.oauth2({ provider }, context);

    const authorizationToken = await oauth2Service.getAuthorizationCode(authorizationCode, redirectUrl);

    if (!authorizationToken) throw new Error('Unable to authorize user');

    const data = await oauth2Service.getAccountData(authorizationToken);
    if (!data || !data?.email) {
      throw new Error('OAuth authentication failed');
    }
    return oauth2Service.linkOAuthProvider(userId, {
      data,
      authorizationToken,
      authorizationCode,
    });
    if (user) return true;
  } catch (e) {
    if (e.code === 'EmailAlreadyExists') throw new EmailAlreadyExistsError({});
    else throw new AuthOperationFailedError({});
  }
}
