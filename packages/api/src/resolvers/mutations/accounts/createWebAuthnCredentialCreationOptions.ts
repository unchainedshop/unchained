import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

export default async function createWebAuthnCredentialCreationOptions(
  root: never,
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
