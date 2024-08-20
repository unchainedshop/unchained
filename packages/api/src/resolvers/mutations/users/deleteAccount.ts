import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

const deleteAccount = async (_, { userId }, context: Context) => {
  const { modules, userAgent, userId: currentUserId } = context;
  log(`mutation deleteAccount ${userId} ${userAgent}`, { userId });
  await modules.users.deleteAccount({ userId: userId || currentUserId }, context);
  return true;
};

export default deleteAccount;
