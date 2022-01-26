import { Context } from '@unchainedshop/types/api';
import { User } from '@unchainedshop/types/user';

export const LoginMethodResponse = {
  user: async ({ id }: { id: string }, _: never, { modules }: Context) => {
    const user = (await modules.users.findUser({ userId: id })) as User & {
      _inLoginMethodResponse: boolean;
    };
    user._inLoginMethodResponse = true;

    return user;
  },
};
