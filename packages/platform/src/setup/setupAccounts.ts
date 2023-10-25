import { User } from '@unchainedshop/types/user.js';
import { randomValueHex } from '@unchainedshop/utils';
import { userSettings } from '@unchainedshop/core-users';
import moniker from 'moniker';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { subscribe } from '@unchainedshop/events';

export const setupAccounts = (unchainedAPI: UnchainedCore) => {
  subscribe('USER_ACCOUNT_ACTION', async ({ payload }: { payload: any }) => {
    await unchainedAPI.modules.worker.addWork({
      type: 'MESSAGE',
      retries: 0,
      input: {
        template: 'ACCOUNT_ACTION',
        recipientEmail: payload.address,
        ...payload,
      },
    });
  });

  const accountsServer = unchainedAPI.modules.accounts.getAccountsServer();

  accountsServer.users = unchainedAPI.modules.users;

  // accountsServer.options.prepareMail = (
  //   to: string,
  //   token: string,
  //   user: User & { id: string },
  //   pathFragment: string,
  // ) => {
  //   return {
  //     template: 'ACCOUNT_ACTION',
  //     recipientEmail: to,
  //     action: pathFragment,
  //     userId: user.id || user._id,
  //     token,
  //     skipMessaging: !!user.guest && pathFragment === 'verify-email',
  //   };
  // };

  // accountsServer.options.sendMail = (input: any) => {
  //   if (!input) return true;
  //   if (input.skipMessaging) return true;

  //   return unchainedAPI.modules.worker.addWork({
  //     type: 'MESSAGE',
  //     retries: 0,
  //     input,
  //   });
  // };

  accountsServer.services.guest = {
    async authenticate(params: { email?: string | null }) {
      const guestname = `${moniker.choose()}-${randomValueHex(5)}`;

      const guestUserId = await unchainedAPI.modules.users.createUser(
        {
          email: params.email || `${guestname}@unchained.local`,
          guest: true,
          password: null,
          initialPassword: true,
        },
        {},
      );
      return unchainedAPI.modules.users.findUserById(guestUserId);
    },
  };

  accountsServer.services.webAuthn = {
    async authenticate(params: { webAuthnPublicKeyCredentials: any }) {
      const username =
        Buffer.from(params.webAuthnPublicKeyCredentials?.response?.userHandle, 'base64').toString() ||
        '';

      const user = await unchainedAPI.modules.users.findUserByUsername(username);
      if (!user) throw new Error('User not found');

      await unchainedAPI.modules.accounts.webAuthn.verifyCredentialRequest(
        user.services?.webAuthn,
        user.username,
        params.webAuthnPublicKeyCredentials,
      );
      return user;
    },
  };

  accountsServer.on('LoginTokenCreated', async (props) => {
    const { userId, connection = {} } = props;

    // TODO: Doubt that there is countryContext etc. here?
    const { userIdBeforeLogin, countryContext, remoteAddress, remotePort, userAgent, normalizedLocale } =
      connection;

    await unchainedAPI.modules.users.updateHeartbeat(userId, {
      remoteAddress,
      remotePort,
      userAgent,
      locale: normalizedLocale,
      countryCode: countryContext,
    });

    const user = await unchainedAPI.modules.users.findUserById(userId);

    if (userIdBeforeLogin) {
      const userBeforeLogin = await unchainedAPI.modules.users.findUserById(userIdBeforeLogin);

      await unchainedAPI.services.orders.migrateOrderCarts(
        {
          fromUser: userBeforeLogin,
          toUser: user,
          shouldMerge: userSettings.mergeUserCartsOnLogin,
          countryContext,
        },
        unchainedAPI,
      );

      await unchainedAPI.services.bookmarks.migrateBookmarks(
        {
          fromUser: userBeforeLogin,
          toUser: user,
          shouldMerge: userSettings.mergeUserCartsOnLogin,
          countryContext,
        },
        unchainedAPI,
      );
    }

    await unchainedAPI.modules.orders.ensureCartForUser(
      {
        user,
        countryCode: countryContext,
      },
      unchainedAPI,
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
