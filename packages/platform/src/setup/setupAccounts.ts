import { Context } from '@unchainedshop/types/api';
import { User } from '@unchainedshop/types/user';
import { check, Match } from 'meteor/check';
import {
  accountsSettings,
  configureAccountServer,
  randomValueHex,
} from 'meteor/unchained:core-accountsjs';
import moniker from 'moniker';

export interface SetupAccountsOptions {
  autoMessagingAfterUserCreation?: boolean;
  mergeUserCartsOnLogin?: boolean;
}

export const setupAccounts = (unchainedAPI: Context, options: SetupAccountsOptions = {}) => {
  const accountsServer = configureAccountServer(unchainedAPI);

  accountsSettings.configureSettings(accountsServer, options);

  accountsServer.users = unchainedAPI.modules.users;

  accountsServer.services.guest = {
    async authenticate(params: { email?: string | null }) {
      check(params.email, Match.OneOf(String, null, undefined));
      const guestname = `${moniker.choose()}-${randomValueHex(5)}`;

      const guestUserId = await unchainedAPI.modules.accounts.createUser(
        {
          email: params.email || `${guestname}@unchained.local`,
          guest: true,
          profile: {},
          password: null,
          initialPassword: true,
          lastBillingAddress: {},
        },
        {},
      );
      return unchainedAPI.modules.users.findUser({
        userId: guestUserId,
      });
    },
  };

  accountsServer.on('LoginTokenCreated', async (props) => {
    const { userId, connection = {} } = props;
    const { userIdBeforeLogin, countryContext, remoteAddress, remotePort, userAgent, normalizedLocale } =
      connection;

    await unchainedAPI.modules.users.updateHeartbeat(userId, {
      remoteAddress,
      remotePort,
      userAgent,
      locale: normalizedLocale,
      countryContext,
    });

    const user = await unchainedAPI.modules.users.findUser({ userId });
    const context = {
      ...unchainedAPI,
      countryContext,
      userId,
      user,
    };

    if (userIdBeforeLogin) {
      const userBeforeLogin = await unchainedAPI.modules.users.findUser({ userId: userIdBeforeLogin });

      await unchainedAPI.services.orders.migrateOrderCarts(
        {
          fromUser: userBeforeLogin,
          toUser: user,
          shouldMerge: options.mergeUserCartsOnLogin,
        },
        context,
      );

      await unchainedAPI.services.bookmarks.migrateBookmarks(
        {
          fromUser: userBeforeLogin,
          toUser: user,
          shouldMerge: options.mergeUserCartsOnLogin,
        },
        context,
      );
    }

    await unchainedAPI.modules.orders.ensureCartForUser(
      {
        user,
      },
      context,
    );
  });

  accountsServer.on('ResetPasswordSuccess', async (user: User) => {
    await unchainedAPI.modules.users.updateInitialPassword(user, false);
  });

  accountsServer.on('ChangePasswordSuccess', async (user: User) => {
    await unchainedAPI.modules.users.updateInitialPassword(user, false);
  });

  accountsServer.on('ValidateLogin', async (params: { service: string; user: User }) => {
    if (params.service !== 'guest' && params.user.guest) {
      await unchainedAPI.modules.users.updateGuest(params.user, false);
    }
    return true;
  });

  return accountsServer;
};
