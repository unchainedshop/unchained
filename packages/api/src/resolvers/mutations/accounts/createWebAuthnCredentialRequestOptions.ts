import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

export default async function createWebAuthnCredentialRequestOptions(
  root: never,
  { extensionOptions, username }: { username: string; extensionOptions: any },
  { modules, userId, getHeader }: Context,
) {
  log(`mutation createWebAuthnCredentialRequestOptions ${username}`, {
    userId,
  });

  const options = await modules.users.webAuthn.createCredentialRequestOptions(
    getHeader('origin') as string,
    username,
    extensionOptions,
  );

  if (username) {
    const user = await modules.users.findUserByUsername(username);
    options.allowCredentials = user?.services?.webAuthn?.map(({ id, type }) => ({
      id,
      type: type || options.type || 'public-key',
    }));
  }

  return options;
}
