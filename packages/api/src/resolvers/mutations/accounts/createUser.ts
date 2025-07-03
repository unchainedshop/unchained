import { UserRegistrationData } from '@unchainedshop/core-users';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import {
  AuthOperationFailedError,
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
  UsernameOrEmailRequiredError,
  PasswordOrWebAuthnPublicKeyRequiredError,
  PasswordInvalidError,
} from '../../../errors.js';

export default async function createUser(root: never, params: UserRegistrationData, context: Context) {
  const { modules, userId } = context;

  log('mutation createUser', { email: params.email, username: params.username, userId });

  if (!params.username && !params.email) {
    throw new UsernameOrEmailRequiredError({});
  }

  if (!params.password && !params.webAuthnPublicKeyCredentials) {
    throw new PasswordOrWebAuthnPublicKeyRequiredError({ username: params?.username });
  }

  try {
    const usersCountBeforeCreation = await context.modules.users.count({
      includeDeleted: true,
      includeGuests: true,
    });

    const newUserId = await modules.users.createUser(
      {
        ...params,
        initialPassword: false,
        roles: usersCountBeforeCreation === 0 ? ['admin'] : [],
      },
      {},
    );

    const user = await context.modules.users.updateHeartbeat(newUserId, {
      remoteAddress: context.remoteAddress,
      remotePort: context.remotePort,
      userAgent: context.getHeader('user-agent'),
      locale: context.locale.baseName,
      countryCode: context.countryCode,
    });

    await context.services.orders.nextUserCart({ user, countryCode: context.countryCode });

    return context.login(user);
  } catch (e) {
    if (e.cause === 'EMAIL_INVALID') throw new EmailAlreadyExistsError({ email: params?.email });
    else if (e.cause === 'USERNAME_INVALID')
      throw new UsernameAlreadyExistsError({ username: params?.username });
    else if (e.cause === 'PASSWORD_INVALID')
      throw new PasswordInvalidError({ username: params?.username });
    else throw new AuthOperationFailedError({ username: params?.username, email: params.email });
  }
}
