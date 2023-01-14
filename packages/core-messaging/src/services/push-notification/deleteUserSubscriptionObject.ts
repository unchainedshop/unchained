import { Context } from '@unchainedshop/types/api.js';

const deleteUserSubscriptionObject = async ({ userId, userAgent }, { modules }: Context) => {
  await modules.users.updateUser(
    { _id: userId },
    {
      $pull: {
        'services.pushNotification': { userAgent },
      },
    },
    {},
  );
};

export default deleteUserSubscriptionObject;
