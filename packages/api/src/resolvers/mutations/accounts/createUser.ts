import { UserData } from '@unchainedshop/types/accounts';
import { Context, Root } from '@unchainedshop/types/api';
import { log } from '@unchainedshop/logger';
import { hashPassword } from '../../../hashPassword';

export default async function createUser(root: Root, params: UserData, context: Context) {
  const { modules, userId } = context;

  log('mutation createUser', { email: params.email, username: params.username, userId });

  if (!params.password && !params.plainPassword && !params.webAuthnPublicKeyCredentials) {
    throw new Error('Password or Public Key is required');
  }

  const mappedUser = { ...params };
  if (!mappedUser.password && mappedUser.plainPassword) {
    mappedUser.password = hashPassword(mappedUser.plainPassword);
  }
  delete mappedUser.plainPassword;
  delete mappedUser.webAuthnPublicKeyCredentials;

  const webAuthnService =
    params.webAuthnPublicKeyCredentials &&
    (await modules.accounts.webAuthn.verifyCredentialCreation(
      params.username,
      params.webAuthnPublicKeyCredentials,
    ));

  const newUserId = await modules.accounts.createUser(mappedUser, {
    skipPasswordEnrollment: !!webAuthnService,
  });

  if (newUserId && webAuthnService) {
    await modules.users.updateUser(
      { _id: newUserId },
      {
        $push: {
          'services.webAuthn': webAuthnService,
        },
      },
      {},
    );
  }

  return modules.accounts.createLoginToken(newUserId, context);
}
