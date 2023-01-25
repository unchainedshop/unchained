import { Context } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

const removePushSubscription = async (_, { p256dh }, context: Context): Promise<any> => {
  const { modules, userId, userAgent } = context;
  log(`mutation removePushSubscription ${userId}   ${userAgent}`);

  try {
    await modules.users.updateUser(
      { _id: userId },
      {
        $pull: {
          pushSubscriptions: { keys: { p256dh } },
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
