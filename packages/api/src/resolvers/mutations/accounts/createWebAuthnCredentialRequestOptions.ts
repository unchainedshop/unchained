import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function createWebAuthnCredentialRequestOptions(
  root: never,
  { extensionOptions, username }: { username: string; extensionOptions: any },
  { modules, userId, getHeader }: Context,
) {
  log(`mutation createWebAuthnCredentialRequestOptions ${username}`, {
    userId,
  });

  const options = await modules.users.webAuthn.createCredentialRequestOptions(
    getHeader('origin'),
    username,
    extensionOptions,
  );

  if (username && options) {
    const user = await modules.users.findUserByUsername(username);
    options.allowCredentials = user?.services?.webAuthn?.map(({ id, type }) => ({
      id,
      type: type || 'public-key',
    }));
  }

  return options;
}
