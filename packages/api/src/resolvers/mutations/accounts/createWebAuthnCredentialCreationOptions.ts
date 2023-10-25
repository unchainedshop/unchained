import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function createWebAuthnCredentialCreationOptions(
  root: Root,
  { extensionOptions, username }: { username: string; extensionOptions: any },
  { modules, userId, req }: Context,
) {
  log(`mutation createWebAuthnCredentialCreationOptions ${username}`, {
    userId,
  });

  const options = await modules.users.webAuthn.createCredentialCreationOptions(
    req.headers.origin,
    username,
    extensionOptions,
  );

  return options;
}
