import { log } from '@unchainedshop/logger';
import { Context } from '@unchainedshop/types/api.js';
import { ImpersonatingAdminUserError, UserNotFoundError } from '../../../errors.js';

const impersonate = async (root, { userId }, context: Context) => {
  log(`mutation impersonate ${userId}`, { userId: context.userId });

  const userToImpersonate = await context.modules.users.findUserById(userId);

  if (!userToImpersonate) {
    throw new UserNotFoundError({ userId });
  }

  if ((userToImpersonate.roles || []).includes('admin')) {
    throw new ImpersonatingAdminUserError({ impersonatedUserId: userId, userId: context.userId });
  }

  return context.modules.accounts.createImpersonationToken(userToImpersonate._id, context);
};

export default impersonate;
