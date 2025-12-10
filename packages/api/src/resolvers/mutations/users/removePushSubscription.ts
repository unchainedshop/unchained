import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

const removePushSubscription = async (_, { p256dh }, context: Context) => {
  const { modules, userId } = context;
  const userAgent = context.getHeader('user-agent');

  log(`mutation removePushSubscription ${userId} ${userAgent}`, { userId });

  await modules.users.removePushSubscription(userId!, p256dh);

  return modules.users.findUserById(userId!);
};

export default removePushSubscription;
