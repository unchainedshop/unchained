import { Context } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

const pushNotificationEnabled = async (_, __, context: Context): Promise<boolean> => {
  const { modules, userId, userAgent } = context;
  log(`mutation pushNotificationEnabled ${userId} ${userAgent} `);

  return modules.users.pushEnabledByUser({ userId, userAgent });
};

export default pushNotificationEnabled;
