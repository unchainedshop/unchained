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

export const setupAccounts = (
  options: SetupAccountsOptions = { mergeUserCartsOnLogin: true },
  unchainedAPI: Context
) => {
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
        },
        {}
      );
      return await unchainedAPI.modules.users.findUser({
        userId: guestUserId,
      });
    },
  };

  accountsServer.on('LoginTokenCreated', async (props) => {
    const { user, connection = {} } = props;
    const {
      userIdBeforeLogin,
      countryContext,
      remoteAddress,
      remotePort,
      userAgent,
      normalizedLocale,
    } = connection;

    const userId = connection.userId || unchainedAPI.userId;
    const context = {
      ...unchainedAPI,
      userId,
      user,
    };

    await unchainedAPI.modules.users.updateHeartbeat(user._id, {
      remoteAddress,
      remotePort,
      userAgent,
      locale: normalizedLocale,
      countryContext,
    });

    if (userIdBeforeLogin) {
      await unchainedAPI.services.orders.migrateOrderCarts(
        {
          fromUserId: userIdBeforeLogin,
          toUser: user,
          countryContext,
          shouldMergeCarts: options.mergeUserCartsOnLogin,
        },
        context
      );

      await unchainedAPI.services.bookmarks.migrateBookmarks(
        {
          fromUserId: userIdBeforeLogin,
          toUserId: user._id,
          shouldMergeBookmarks: options.mergeUserCartsOnLogin,
        },
        context
      );
    }

    await unchainedAPI.modules.orders.ensureCartForUser(
      {
        user,
        countryContext,
      },
      context
    );
  });

  accountsServer.on('ResetPasswordSuccess', async (user: User) => {
    await unchainedAPI.modules.users.updateInitialPassword(user, false);
  });

  accountsServer.on('ChangePasswordSuccess', async (user: User) => {
    await unchainedAPI.modules.users.updateInitialPassword(user, false);
  });

  accountsServer.on(
    'ValidateLogin',
    async (params: { service: string; user: User }) => {
      if (params.service !== 'guest' && params.user.guest) {
        await unchainedAPI.modules.users.updateGuest(params.user, false);
      }
      return true;
    }
  );

  return accountsServer;
};
