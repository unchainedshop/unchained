import { AccountsModule, AccountsSettingsOptions } from '@unchainedshop/types/accounts';
import { log, LogLevel } from '@unchainedshop/logger';
import { v4 as uuidv4 } from 'uuid';
import { ModuleInput } from '@unchainedshop/types/core';
import { accountsSettings } from '../accounts-settings';
import { accountsPassword } from '../accounts/accountsPassword';
import { UnchainedAccountsServer } from '../accounts/accountsServer';
import { createDbManager } from '../accounts/dbManager';
import { evaluateContext } from './utils/evaluateContext';
import { filterContext } from './utils/filterContext';
import { hashPassword } from './utils/hashPassword';
import { configureAccountsWebAuthnModule } from './configureAccountsWebAuthnModule';

export const configureAccountsModule = async ({
  db,
  options,
}: ModuleInput<AccountsSettingsOptions>): Promise<AccountsModule> => {
  const dbManager = createDbManager(db);

  const accountsServer = new UnchainedAccountsServer(
    {
      db: dbManager,
      useInternalUserObjectSanitizer: false,
      siteUrl: process.env.ROOT_URL,
      tokenSecret: process.env.UNCHAINED_TOKEN_SECRET,
    },
    {
      password: accountsPassword,
    },
  );

  accountsSettings.configureSettings(options || {}, { accountsPassword, accountsServer });

  const webAuthn = await configureAccountsWebAuthnModule({ db, options });

  return {
    dbManager,

    getAccountsServer: () => accountsServer,

    emit: (event, meta) => accountsServer.getHooks().emit(event, meta),

    // Mutations
    createUser: async (userData, { skipMessaging, skipPasswordEnrollment } = {}) => {
      const userId = await accountsPassword.createUser(userData);

      const autoMessagingEnabled = skipMessaging
        ? false
        : accountsSettings.autoMessagingAfterUserCreation && !!userData.email && !!userId;

      if (autoMessagingEnabled) {
        if (userData.password === undefined) {
          if (!skipPasswordEnrollment) {
            await accountsPassword.sendEnrollmentEmail(userData.email);
          }
        } else {
          await accountsPassword.sendVerificationEmail(userData.email);
        }
      }
      return userId;
    },

    // Email
    addEmail: (userId, email) => accountsPassword.addEmail(userId, email, false),
    removeEmail: async (userId, email) => accountsPassword.removeEmail(userId, email),

    findUnverifiedUserByToken: async (token) => dbManager.findUserByEmailVerificationToken(token),

    // eslint-disable-next-line
    // @ts-ignore : Accountsjs is BADLY typed!
    findUserByEmail: async (email) => accountsPassword.findUserByEmail(email),

    // eslint-disable-next-line
    // @ts-ignore : Accountsjs is BADLY typed!
    findUserByUsername: async (username) => accountsPassword.findUserByUsername(username),

    sendVerificationEmail: async (email) => accountsPassword.sendVerificationEmail(email),
    sendEnrollmentEmail: async (email) => accountsPassword.sendEnrollmentEmail(email),
    verifyEmail: async (token) => accountsPassword.verifyEmail(token),

    // Autentication
    createLoginToken: async (userId, rawContext) => {
      const context = evaluateContext(filterContext(rawContext));

      const { user: tokenUser, token: loginToken } = await accountsServer.loginWithUser(userId);

      await accountsServer.getHooks().emit('LoginTokenCreated', {
        userId: tokenUser,
        connection: context,
        service: null,
      });

      return {
        id: userId,
        token: loginToken.token,
        tokenExpires: loginToken.when,
      };
    },

    createImpersonationToken: async (userId, rawContext) => {
      const context = evaluateContext(filterContext(rawContext));

      const { user: tokenUser, token: loginToken } = await accountsServer.loginWithUser(userId);

      await accountsServer.getHooks().emit('ImpersonationSuccess', {
        user: context.user,
        impersonationResult: {
          authorized: true,
          tokens: loginToken,
          user: tokenUser,
        },
      });

      return {
        id: userId,
        token: loginToken.token,
        tokenExpires: loginToken.when,
      };
    },

    createHashLoginToken: (loginToken) => accountsServer.hashLoginToken(loginToken),

    loginWithService: async (params, rawContext) => {
      const context = evaluateContext(filterContext(rawContext));

      // eslint-disable-next-line
      // @ts-ignore : Accountsjs is BADLY typed!
      const { user: tokenUser, token: loginToken } = await accountsServer.loginWithService(
        params.service,
        params,
        context,
      );

      await accountsServer.getHooks().emit('LoginTokenCreated', {
        // eslint-disable-next-line
        // @ts-ignore : Accountsjs is BADLY typed!
        userId: tokenUser._id,
        user: tokenUser,
        connection: context,
        service: params.service,
      });

      return {
        // eslint-disable-next-line
        // @ts-ignore : Accountsjs is BADLY typed!
        id: tokenUser._id,
        token: loginToken.token,
        tokenExpires: loginToken.when,
      };
    },

    logout: async ({ token }, { loginToken, userId }) => {
      const logoutError = await accountsServer
        .logout({
          token: token || accountsServer.hashLoginToken(loginToken),
          userId,
        })
        .catch((error) => error);

      return {
        success: !logoutError,
        error: logoutError,
      };
    },

    // User management
    setUsername: (_id, username) => dbManager.setUsername(_id, username),
    setPassword: async (userId, { newPassword: newHashedPassword, newPlainPassword }) => {
      const newPassword =
        newHashedPassword ||
        (newPlainPassword && hashPassword(newPlainPassword)) ||
        uuidv4().split('-').pop();

      await accountsPassword.setPassword(userId, newPassword);
    },

    changePassword: async (
      userId,
      {
        newPassword: newHashedPassword,
        newPlainPassword,
        oldPassword: oldHashedPassword,
        oldPlainPassword,
      },
    ) => {
      const newPassword = newHashedPassword || hashPassword(newPlainPassword);
      const oldPassword = oldHashedPassword || hashPassword(oldPlainPassword);

      try {
        await accountsPassword.changePassword(userId, oldPassword, newPassword);
        return true;
      } catch (error: any) {
        log('Error while changing password', {
          level: LogLevel.Error,
          ...error,
        });
        return false;
      }
    },
    sendResetPasswordEmail: async (email) => {
      try {
        await accountsPassword.sendResetPasswordEmail(email);
        return true;
      } catch (error) {
        log('Error while sending reset password', {
          level: LogLevel.Error,
          ...error,
          email,
        });
        return false;
      }
    },

    resetPassword: async ({ newPassword: newHashedPassword, newPlainPassword, token }, context) => {
      const user = await dbManager.findUserByResetPasswordToken(token);

      const newPassword = newHashedPassword || hashPassword(newPlainPassword);
      await accountsPassword.resetPassword(token, newPassword, context);

      return user;
    },

    // TOTP
    buildTOTPSecret: () => {
      const authSecret = accountsPassword.twoFactor.getNewAuthSecret();
      return authSecret.otpauth_url;
    },

    enableTOTP: async (userId, secret, code) => {
      await accountsPassword.twoFactor.set(userId, { base32: secret } as any, code);
      return true;
    },

    disableTOTP: async (userId, code) => {
      await accountsPassword.twoFactor.unset(userId, code);
      // https://github.com/accounts-js/accounts/issues/1181
      const wait = async (time: number) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(true);
          }, time);
        });
      };
      await wait(500);
      return true;
    },

    webAuthn,
  };
};
