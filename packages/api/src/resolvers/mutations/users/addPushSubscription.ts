import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

const addPushSubscription = async (
  _,
  { subscription, unsubscribeFromOtherUsers = false },
  context: Context,
) => {
  const { modules, userId } = context;
  const userAgent = context.getHeader('user-agent');
  log(`mutation addPushSubscription ${userAgent}`, { userId });

  await modules.users.addPushSubscription(userId, subscription, {
    userAgent,
    unsubscribeFromOtherUsers,
  });

  return modules.users.findUserById(userId);
};

export default addPushSubscription;
