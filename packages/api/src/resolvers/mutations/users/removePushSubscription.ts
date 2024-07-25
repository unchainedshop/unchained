import { Context } from '../../../types.js';
import { log } from '@unchainedshop/logger';

const removePushSubscription = async (_, { p256dh }, context: Context) => {
  const { modules, userId, userAgent } = context;
  log(`mutation removePushSubscription ${userId} ${userAgent}`, { userId });

  await modules.users.removePushSubscription(userId, p256dh);

  return modules.users.findUserById(userId);
};

export default removePushSubscription;
