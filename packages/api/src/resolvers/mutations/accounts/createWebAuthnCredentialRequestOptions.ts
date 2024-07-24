import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function createWebAuthnCredentialRequestOptions(
  root: Root,
  { extensionOptions, username }: { username: string; extensionOptions: any },
  { modules, userId, getHeader }: Context,
) {
  log(`mutation createWebAuthnCredentialRequestOptions ${username}`, {
    userId,
  });

  const options = await modules.accounts.webAuthn.createCredentialRequestOptions(
    getHeader('origin') as string,
    username,
    extensionOptions,
  );

  if (username) {
    const user = await modules.users.findUser({ username });
    options.allowCredentials = user?.services?.webAuthn?.map(({ id, type }) => ({
      id,
      type: type || options.type || 'public-key',
    }));
  }

  return options;
}
