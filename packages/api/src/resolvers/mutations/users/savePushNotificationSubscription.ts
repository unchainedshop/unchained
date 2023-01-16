import { Context } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

const savePushNotificationSubscription = async (
  _,
  { subscription },
  context: Context,
): Promise<boolean> => {
  const { modules, userId, userAgent } = context;
  log(`mutation savePushNotificationSubscription ${userId} ${userAgent} `);
  try {
    await modules.users.updateUser(
      { _id: userId },
      {
        $push: {
          pushSubscriptions: {
            userAgent,
            ...subscription,
          },
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

export default savePushNotificationSubscription;
