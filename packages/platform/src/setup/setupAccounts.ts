import { Context } from '@unchainedshop/types/api';
import { User } from '@unchainedshop/types/user';
import { randomValueHex } from '@unchainedshop/utils';
import { accountsSettings } from '@unchainedshop/core-accountsjs';
import moniker from 'moniker';

export const setupAccounts = (unchainedAPI: Context) => {
  const accountsServer = unchainedAPI.modules.accounts.getAccountsServer();

  accountsServer.users = unchainedAPI.modules.users;

  accountsServer.options.prepareMail = (
    to: string,
    token: string,
    user: User & { id: string },
    pathFragment: string,
  ) => {
    return {
      template: 'ACCOUNT_ACTION',
      recipientEmail: to,
      action: pathFragment,
      userId: user.id || user._id,
      token,
      skipMessaging: !!user.guest && pathFragment === 'verify-email',
    };
  };

  accountsServer.options.sendMail = (input: any) => {
    if (!input) return true;
    if (input.skipMessaging) return true;

    return unchainedAPI.modules.worker.addWork(
      {
        type: 'MESSAGE',
        retries: 0,
        input,
      },
      unchainedAPI.userId,
    );
  };

  accountsServer.services.guest = {
    async authenticate(params: { email?: string | null }) {
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
      return unchainedAPI.modules.users.findUserById(guestUserId);
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

    const user = await unchainedAPI.modules.users.findUserById(userId);
    const context = {
      ...unchainedAPI,
      countryContext,
      userId,
      user,
    };

    if (userIdBeforeLogin) {
      const userBeforeLogin = await unchainedAPI.modules.users.findUserById(userIdBeforeLogin);

      await unchainedAPI.services.orders.migrateOrderCarts(
        {
          fromUser: userBeforeLogin,
          toUser: user,
          shouldMerge: accountsSettings.mergeUserCartsOnLogin,
        },
        context,
      );

      await unchainedAPI.services.bookmarks.migrateBookmarks(
        {
          fromUser: userBeforeLogin,
          toUser: user,
          shouldMerge: accountsSettings.mergeUserCartsOnLogin,
        },
        context,
      );
    }

    await unchainedAPI.modules.orders.ensureCartForUser(
      {
        user,
        countryCode: countryContext,
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
