import { Context } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

const removePushSubscription = async (_, __, context: Context): Promise<any> => {
  const { modules, userId, userAgent } = context;
  log(`mutation removePushSubscription ${userId}   ${userAgent}`);

  try {
    const isEnabled = await modules.users.pushEnabledByUser({ userId, userAgent });
    if (isEnabled) throw new Error('Push Notification is not enabled by User');

    await modules.users.updateUser(
      { _id: userId },
      {
        $pull: {
          pushSubscriptions: { userAgent },
        },
      },
      {},
    );
    return true;
  } catch (e) {
    log(e.message);
    return false;
  }
};

export default removePushSubscription;
