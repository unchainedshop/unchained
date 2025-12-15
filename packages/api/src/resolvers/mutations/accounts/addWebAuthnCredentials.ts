import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { WebAuthnDisabledError } from '../../../errors.ts';

export default async function addWebAuthnCredentials(
  _root: never,
  { credentials }: { credentials: any },
  { modules, userId, user }: Context,
) {
  log(`mutation addWebAuthnCredentials ${user!.username}`, {
    userId,
  });

  const webAuthnService = await modules.users.webAuthn.verifyCredentialCreation(
    user!.username!,
    credentials,
  );

  if (!webAuthnService) throw new WebAuthnDisabledError();

  return modules.users.addWebAuthnCredential(userId!, webAuthnService);
}
