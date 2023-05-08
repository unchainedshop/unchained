import { Context } from '@unchainedshop/types/api.js';

export const OAuthAccount = {
  _id: (account) => account.id,
  provider: async (account, _: never, { modules }: Context) => {
    return modules.accounts.oAuth2.getProvider(account.provider);
  },
};
