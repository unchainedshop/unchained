import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { WebAuthnDisabledError } from '../../../errors.js';

export default async function addWebAuthnCredentials(
  root: never,
  { credentials }: { credentials: any },
  { modules, userId, user }: Context,
) {
  log(`mutation addWebAuthnCredentials ${user.username}`, {
    userId,
  });

  const webAuthnService = await modules.users.webAuthn.verifyCredentialCreation(
    user.username,
    credentials,
  );

  if (!webAuthnService) throw new WebAuthnDisabledError();

  return modules.users.updateUser(
    { _id: userId },
    {
      $push: {
        'services.webAuthn': webAuthnService,
      },
    },
    {},
  );
}
