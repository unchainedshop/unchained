import { Context } from '@unchainedshop/types/api.js';
import { User } from '@unchainedshop/types/user.js';

export const LoginMethodResponse = {
  user: async ({ id }: { id: string }, _: never, { modules }: Context) => {
    const user = (await modules.users.findUserById(id)) as User & {
      _inLoginMethodResponse: boolean;
    };
    user._inLoginMethodResponse = true; // eslint-disable-line

    return user;
  },
  token({ token, tokenExpires }, _, { res, setLoginToken }: Context) {
    setLoginToken(res, token, tokenExpires);
    return token;
  },
};
