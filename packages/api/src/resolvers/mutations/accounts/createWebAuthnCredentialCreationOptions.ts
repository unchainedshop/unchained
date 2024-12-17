import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

export default async function createWebAuthnCredentialCreationOptions(
  root: never,
  { extensionOptions, username }: { username: string; extensionOptions: any },
  { modules, userId, getHeader }: Context,
) {
  log(`mutation createWebAuthnCredentialCreationOptions ${username}`, {
    userId,
  });

  const options = await modules.users.webAuthn.createCredentialCreationOptions(
    getHeader('origin'),
    username,
    extensionOptions,
  );

  return options;
}
