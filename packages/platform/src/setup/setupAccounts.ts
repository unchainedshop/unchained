import { User } from '@unchainedshop/types/user.js';
import { randomValueHex } from '@unchainedshop/utils';
import { accountsSettings } from '@unchainedshop/core-accountsjs';
import moniker from 'moniker';
import { UnchainedCore } from '@unchainedshop/types/core.js';

export const setupAccounts = (unchainedAPI: UnchainedCore) => {
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

    return unchainedAPI.modules.worker.addWork({
      type: 'MESSAGE',
      retries: 0,
      input,
    });
  };

  accountsServer.services.guest = {
    async authenticate(params: { email?: string | null }) {
      const guestname = `${moniker.choose()}-${randomValueHex(5)}`;

      const guestUserId = await unchainedAPI.modules.accounts.createUser(
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

      const user = await unchainedAPI.modules.users.findUser({ username });
      if (!user) throw new Error('User not found');

      await unchainedAPI.modules.accounts.webAuthn.verifyCredentialRequest(
        user.services?.webAuthn,
        user.username,
        params.webAuthnPublicKeyCredentials,
      );
      return user;
    },
  };

  accountsServer.services.oauth2 = {
    async authenticate({
      authorizationCode,
      provider,
      redirectUrl,
    }: {
      authorizationCode: any;
      provider: string;
      redirectUrl: string;
    }): Promise<any> {
      if (!authorizationCode || !provider) {
        return undefined;
      }

      const { modules, services } = unchainedAPI;

      const authorizationToken = await modules.accounts.oAuth2.getAuthorizationToken(
        provider,
        authorizationCode,
        redirectUrl,
      );

      if (!authorizationToken) throw new Error('Unable to authorize user');
      const data = await modules.accounts.oAuth2.getAccountData(provider, authorizationToken);
      if (!data?.id) {
        throw new Error('OAuth authentication failed or no id returned from service');
      }

      const user = await unchainedAPI.modules.users.findUser({
        [`services.oauth.${provider}.id`]: data.id,
      });

      if (!user) {
        const newUserId = await unchainedAPI.modules.accounts.createUser(
          {
            username: data.username || `${data.id}`,
            email: data.email,
            guest: false,
            initialPassword: undefined,
            password: undefined,
            profile: {
              address: {
                firstName: data?.firstName,
                lastName: data?.lastName,
                addressLine: data?.address,
                city: data?.city,
                countryCode: data?.countryCode,
                regionCode: data?.regionCode,
                postalCode: data?.postalCode,
                company: data?.company,
              },
              gender: data?.gender,
              phoneMobile: data?.phoneNumber,
              displayName: data?.displayName,
              birthday: data?.birthDate,
            },
          },
          { skipPasswordEnrollment: true },
        );

        await modules.users.updateUser(
          { _id: newUserId },
          {
            $push: {
              [`services.oauth.${provider}`]: {
                id: data.id,
                authorizationToken,
                authorizationCode,
                data,
              },
            },
          },
          { upsert: true },
        );

        if (data?.avatarUrl) {
          const file = await services.files.uploadFileFromURL(
            {
              directoryName: 'user-avatars',
              fileInput: {
                fileLink: data.avatarUrl,
                fileName: `${data.firstName}-avatar`,
              },
              meta: { userId: newUserId },
            },
            unchainedAPI,
          );
          if (user?.avatarId) {
            await services.files.removeFiles(
              {
                fileIds: [user.avatarId as string],
              },
              unchainedAPI,
            );
          }
          return modules.users.updateAvatar(newUserId, file._id);
        }
      }

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
          fromUserId: userBeforeLogin._id,
          toUserId: user._id,
          shouldMerge: accountsSettings.mergeUserCartsOnLogin,
          countryContext:
            countryContext || userBeforeLogin.lastLogin?.countryCode || user.lastLogin?.countryCode,
        },
        unchainedAPI,
      );

      await unchainedAPI.services.bookmarks.migrateBookmarks(
        {
          fromUserId: userBeforeLogin._id,
          toUserId: user._id,
          shouldMerge: accountsSettings.mergeUserCartsOnLogin,
          countryContext:
            countryContext || userBeforeLogin.lastLogin?.countryCode || user.lastLogin?.countryCode,
        },
        unchainedAPI,
      );
    }

    return unchainedAPI.services.orders.nextUserCart(
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
