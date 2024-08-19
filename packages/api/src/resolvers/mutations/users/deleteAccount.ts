import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

const deleteAccount = async (_, { userId }, context: Context) => {
  const { modules, userAgent } = context;
  log(`mutation deleteAccount ${userId} ${userAgent}`, { userId });
  await modules.users.deleteAccount({ userId }, context);
  return true;
};

export default deleteAccount;
