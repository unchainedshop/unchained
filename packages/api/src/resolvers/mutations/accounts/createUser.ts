import { UserData } from '@unchainedshop/types/user.js';
import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import {
  AuthOperationFailedError,
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
  UsernameOrEmailRequiredError,
} from '../../../errors.js';

export default async function createUser(root: Root, params: UserData, context: Context) {
  const { modules, userId } = context;

  log('mutation createUser', { email: params.email, username: params.username, userId });

  if (!params.password && !params.webAuthnPublicKeyCredentials) {
    throw new Error('Password or Public Key is required');
  }

  try {
    const newUserId = await modules.users.createUser(
      {
        ...params,
        initialPassword: false,
      },
      {},
    );
    return modules.accounts.createLoginToken(newUserId, context);
  } catch (e) {
    if (e.code === 'EmailAlreadyExists') throw new EmailAlreadyExistsError({ email: params?.email });
    else if (e.code === 'UsernameAlreadyExists')
      throw new UsernameAlreadyExistsError({ username: params?.username });
    else if (e.code === 'UsernameOrEmailRequired')
      throw new UsernameOrEmailRequiredError({ username: params?.username });
    else throw new AuthOperationFailedError({ username: params?.username, email: params.email });
  }
}
