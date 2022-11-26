import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserData } from '@unchainedshop/types/accounts';
import { hashPassword } from '../../../hashPassword';
import {
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
  UsernameOrEmailRequiredError,
} from '../../../errors';

export default async function enrollUser(root: Root, params: UserData, context: Context) {
  const { modules } = context;

  log('mutation enrollUser', { email: params.email, userId: context.userId });

  const mappedUserData = params;
  mappedUserData.initialPassword = true;
  if (mappedUserData.plainPassword) {
    mappedUserData.password = hashPassword(mappedUserData.plainPassword);
  }
  delete mappedUserData.plainPassword;

  // Skip Messaging when password is set so we
  // don't send a verification e-mail after enrollment
  try {
    const userId = await modules.accounts.createUser(mappedUserData, {
      skipMessaging: !!mappedUserData.password,
    });

    return modules.users.findUserById(userId);
  } catch (e) {
    if (e.code === 'EmailAlreadyExists') throw new EmailAlreadyExistsError({ email: params?.email });
    else if (e.code === 'UsernameAlreadyExists')
      throw new UsernameAlreadyExistsError({ username: params?.username });
    else if (e.code === 'UsernameOrEmailRequired')
      throw new UsernameOrEmailRequiredError({ username: params?.username });
    else throw e;
  }
}
