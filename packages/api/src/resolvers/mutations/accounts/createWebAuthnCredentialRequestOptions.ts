import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function createWebAuthnCredentialRequestOptions(
  root: Root,
  { extensionOptions, username }: { username: string; extensionOptions: any },
  { modules, userId, req }: Context,
) {
  log(`mutation createWebAuthnCredentialRequestOptions ${username}`, {
    userId,
  });

  const options = await modules.users.webAuthn.createCredentialRequestOptions(
    req.headers.origin,
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
