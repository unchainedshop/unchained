import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { UserWebAuthnCredentialsNotFoundError } from '../../../errors.js';

export default async function removeWebAuthnCredentials(
  root: Root,
  { credentialsId }: { credentialsId: string },
  { modules, userId, user }: Context,
) {
  log(`mutation removeWebAuthnCredentials ${credentialsId} ${user.username}`, {
    userId,
  });

  const foundCredentials = user.services?.webAuthn?.find((service) => service.id === credentialsId);
  if (!foundCredentials) {
    throw new UserWebAuthnCredentialsNotFoundError({ userId, credentialsId });
  }

  return modules.users.updateUser(
    { _id: userId },
    {
      $pull: {
        'services.webAuthn': { id: credentialsId },
      },
    },
    {},
  );
}
