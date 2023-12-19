import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function addWebAuthnCredentials(
  root: Root,
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

  await modules.users.updateUser(
    { _id: userId },
    {
      $push: {
        'services.webAuthn': webAuthnService,
      },
    },
    {},
  );

  return modules.users.findUserById(userId);
}
