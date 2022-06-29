import { log } from '@unchainedshop/logger';
import { Context } from '@unchainedshop/types/api';
import { UserNotFoundError, NoPermissionError } from '../../../errors';

const impersonate = async (root, { userId }, context: Context) => {
  log(`mutation impersonate ${userId}`);

  const userToImpersonate = await context.modules.users.findUserById(userId);

  if (!userToImpersonate) {
    throw new UserNotFoundError(`No user with id ${userId}`);
  }

  if ((userToImpersonate.roles || []).includes('admin')) {
    throw new NoPermissionError("Cannot impersonate users with role 'admin'");
  }

  return context.modules.accounts.createImpersonationToken(userToImpersonate._id, context);
};

export default impersonate;
