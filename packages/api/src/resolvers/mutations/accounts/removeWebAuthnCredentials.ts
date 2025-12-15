import { log } from '@unchainedshop/logger';
import { UserWebAuthnCredentialsNotFoundError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function removeWebAuthnCredentials(
  root: never,
  { credentialsId }: { credentialsId: string },
  { modules, userId, user }: Context,
) {
  log(`mutation removeWebAuthnCredentials ${credentialsId} ${user?.username}`, {
    userId,
  });

  const foundCredentials = user?.services?.webAuthn?.find((service) => service.id === credentialsId);
  if (!foundCredentials) {
    throw new UserWebAuthnCredentialsNotFoundError({ userId, credentialsId });
  }

  return modules.users.removeWebAuthnCredential(userId!, credentialsId);
}
