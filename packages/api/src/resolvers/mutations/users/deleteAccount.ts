import { Context } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

const deleteAccount = async (_, { userId }, context: Context) => {
  const { modules, userAgent } = context;
  log(`mutation deleteAccount ${userId} ${userAgent}`, { userId });
  await modules.users.deleteAccount({ userId }, context);
  return true;
};

export default deleteAccount;
