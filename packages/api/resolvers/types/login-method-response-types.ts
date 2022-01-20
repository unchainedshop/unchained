import { Context } from '@unchainedshop/types/api';

export const LoginMethodResponse = {
  user: async ({ id }: { id: string }, _: never, { modules }: Context) => {
    const user = await modules.users.findUser({ userId: id });
    /* @ts-ignore */
    user._inLoginMethodResponse = true;
    return user;
  },
};
