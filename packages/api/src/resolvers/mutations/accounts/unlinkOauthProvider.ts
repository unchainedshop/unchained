import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function unlinkOauthProvider(
  root: Root,
  { provider, authorizationCode }: { provider: string; authorizationCode: string },
  context: Context,
) {
  const { modules, services, userId, user } = context;

  log(`mutation unlinkOauthProvider ${user.username}`, {
    userId,
  });

  const oauthService = await services.accounts.oauth2({ provider }, context);
  await oauthService.unLinkOauthProvider(userId, authorizationCode);

  return modules.users.findUserById(userId);
}
