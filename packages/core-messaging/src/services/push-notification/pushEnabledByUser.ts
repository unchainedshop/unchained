import { Context } from '@unchainedshop/types/api.js';

const pushEnabledByUser = async ({ userId }, unchainedAPI: Context) => {
  const user = await unchainedAPI.modules.users.findUser({ userId }, { projection: { _id: 1 } });
  return !!user;
};

export default pushEnabledByUser;
