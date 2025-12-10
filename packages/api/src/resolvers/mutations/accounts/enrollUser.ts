import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

import type { UserRegistrationData } from '@unchainedshop/core-users';
import {
  AuthOperationFailedError,
  EmailAlreadyExistsError,
  PasswordInvalidError,
  UsernameAlreadyExistsError,
  UsernameOrEmailRequiredError,
} from '../../../errors.ts';

export default async function enrollUser(root: never, params: UserRegistrationData, context: Context) {
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
