import { log } from '@unchainedshop/logger';
import { ImpersonatingAdminUserError, UserNotFoundError } from '../../../errors.js';
import { Context } from '../../../context.js';

const impersonate = async (root, { userId }, context: Context) => {
  log(`mutation impersonate ${userId}`, { userId: context.userId });

  const userToImpersonate = await context.modules.users.findUserById(userId);

  if (!userToImpersonate) {
    throw new UserNotFoundError({ userId });
  }

  if ((userToImpersonate.roles || []).includes('admin')) {
    throw new ImpersonatingAdminUserError({ impersonatedUserId: userId, userId: context.userId });
  }

  await context.services.orders.nextUserCart({
    user: userToImpersonate,
    countryCode: context.countryContext,
  });

  return context.login(userToImpersonate, {
    impersonator: context.user,
  });
};

export default impersonate;
