import { log } from '@unchainedshop/logger';
import { Context } from '@unchainedshop/types/api.js';
import { UserNotFoundError } from '../../../errors.js';

const impersonate = async (root, { userId }, context: Context) => {
  console.log(context);
  console.log(context.user, context.userId);
  log(`mutation impersonate ${userId}`);

  const userToImpersonate = await context.modules.users.findUserById(userId);

  if (!userToImpersonate) {
    throw new UserNotFoundError({ userId });
  }

  return context.modules.accounts.createImpersonationToken(userToImpersonate._id, context);
};

export default impersonate;
