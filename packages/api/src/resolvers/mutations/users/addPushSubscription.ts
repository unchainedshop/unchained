import { Context } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

const addPushSubscription = async (_, { subscription }, context: Context): Promise<boolean> => {
  const { modules, userId, userAgent } = context;
  log(`mutation addPushSubscription ${userId} ${userAgent} `);
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

export default addPushSubscription;
