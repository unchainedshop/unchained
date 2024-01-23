import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { UserData } from '@unchainedshop/types/user.js';
import {
  AuthOperationFailedError,
  EmailAlreadyExistsError,
  PasswordInvalidError,
  UsernameAlreadyExistsError,
  UsernameOrEmailRequiredError,
} from '../../../errors.js';

export default async function enrollUser(root: Root, params: UserData, context: Context) {
  const { modules } = context;

  log('mutation enrollUser', { email: params.email, userId: context.userId });

  if (!params.username && !params.email) {
    throw new UsernameOrEmailRequiredError({});
  }

  try {
    const userId = await modules.users.createUser(
      {
        ...params,
        initialPassword: true,
      },
      {
        skipMessaging: !!params.password,
      },
    );

    return modules.users.findUserById(userId);
  } catch (e) {
    if (e.cause === 'EMAIL_INVALID') throw new EmailAlreadyExistsError({ email: params?.email });
    else if (e.cause === 'USERNAME_INVALID')
      throw new UsernameAlreadyExistsError({ username: params?.username });
    else if (e.cause === 'PASSWORD_INVALID')
      throw new PasswordInvalidError({ username: params?.username });
    else throw new AuthOperationFailedError({ username: params?.username, email: params.email });
  }
}
