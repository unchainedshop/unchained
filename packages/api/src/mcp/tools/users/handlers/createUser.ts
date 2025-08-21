import { Context } from '../../../../context.js';
import { removeConfidentialServiceHashes } from '@unchainedshop/core-users';
import {
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
  PasswordInvalidError,
  AuthOperationFailedError,
} from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function createUser(context: Context, params: Params<'CREATE'>) {
  const { modules } = context;
  const { username, email, password, profile } = params;

  try {
    const newUserId = await modules.users.createUser(
      {
        username,
        email,
        password,
        profile,
        initialPassword: false,
      } as any,
      {},
    );

    const user = await context.modules.users.updateHeartbeat(newUserId, {
      remoteAddress: context.remoteAddress,
      remotePort: context.remotePort,
      userAgent: context.getHeader('user-agent'),
      locale: context.locale?.baseName,
      countryCode: context.countryCode,
    });
    return { user: removeConfidentialServiceHashes(user) };
  } catch (e) {
    if (e.cause === 'EMAIL_INVALID') throw new EmailAlreadyExistsError({ email: params?.email });
    else if (e.cause === 'USERNAME_INVALID')
      throw new UsernameAlreadyExistsError({ username: params?.username });
    else if (e.cause === 'PASSWORD_INVALID')
      throw new PasswordInvalidError({ username: params?.username });
    else throw new AuthOperationFailedError({ username: params?.username, email: params.email });
  }
}
