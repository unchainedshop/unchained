import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function createWebAuthnCredentialCreationOptions(
  root: Root,
  { extensionOptions, username }: { username: string; extensionOptions: any },
  { modules, userId, getHeader }: Context,
) {
  log(`mutation createWebAuthnCredentialCreationOptions ${username}`, {
    userId,
  });

  const options = await modules.users.webAuthn.createCredentialCreationOptions(
    getHeader('origin') as string,
    username,
    extensionOptions,
  );

  return options;
}
