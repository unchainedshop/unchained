import { Context } from '@unchainedshop/types/api.js';

const saveUserSubscriptionObject = async ({ subscription, userId, userAgent }, { modules }: Context) => {
  await modules.users.updateUser(
    { _id: userId },
    {
      $push: {
        'services.pushNotification': { subscription, userAgent },
      },
    },
    {},
  );
};

export default saveUserSubscriptionObject;
