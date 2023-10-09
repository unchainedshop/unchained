import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { UserData } from '@unchainedshop/types/user.js';
import {
  AuthOperationFailedError,
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
  UsernameOrEmailRequiredError,
} from '../../../errors.js';

export default async function enrollUser(root: Root, params: UserData, context: Context) {
  const { modules } = context;

  log('mutation enrollUser', { email: params.email, userId: context.userId });
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
    if (e.code === 'EmailAlreadyExists') throw new EmailAlreadyExistsError({ email: params?.email });
    else if (e.code === 'UsernameAlreadyExists')
      throw new UsernameAlreadyExistsError({ username: params?.username, email: params.email });
    else if (e.code === 'UsernameOrEmailRequired')
      throw new UsernameOrEmailRequiredError({ username: params?.username, email: params.email });
    else throw new AuthOperationFailedError({ username: params?.username, email: params.email });
  }
}
