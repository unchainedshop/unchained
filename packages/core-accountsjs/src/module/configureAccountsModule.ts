import { AccountsModule, AccountsSettingsOptions } from '@unchainedshop/types/accounts.js';

import { v4 as uuidv4 } from 'uuid';
import { ModuleInput } from '@unchainedshop/types/core.js';
import { Context } from '@unchainedshop/types/api.js';
import { accountsSettings } from '../accounts-settings.js';
import { accountsPassword } from '../accounts/accountsPassword.js';
import { UnchainedAccountsServer } from '../accounts/accountsServer.js';
import { createDbManager } from '../accounts/dbManager.js';
import { evaluateContext } from './utils/evaluateContext.js';
import { filterContext } from './utils/filterContext.js';
import { hashPassword } from './utils/hashPassword.js';
import { configureAccountsWebAuthnModule } from './configureAccountsWebAuthnModule.js';
import { configureAccountsOAuthModule } from './configureAccountsOAuthModule.js';

export const configureAccountsModule = async ({
  db,
  options,
}: ModuleInput<AccountsSettingsOptions>): Promise<AccountsModule> => {
  const dbManager = createDbManager(db) as any;

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
  const oAuth2 = configureAccountsOAuthModule();

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
      // TODO: rawContext does not contain user and locale date anymore
      // following the type but the code still depends on it
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

    createImpersonationToken: async (userId, rawContext: Context) => {
      // TODO: rawContext does not contain user and locale date anymore
      // following the type but the code still depends on it
      // FIXME: sets the impersonatorId on ALL loginTokens and not only the actual loginToken that was used!
      const { modules } = rawContext;

      const { token: loginToken } = await accountsServer.loginWithUser(userId);

      const tokenUser = await modules.users.updateUser(
        {
          _id: userId,
          'services.resume.loginTokens': {
            $elemMatch: {
              hashedToken: modules.accounts.createHashLoginToken(loginToken.token),
              when: loginToken.when,
            },
          },
        },
        {
          $set: {
            'services.resume.loginTokens.$.impersonatorId': rawContext.userId,
          },
        },
        {},
      );

      await accountsServer.getHooks().emit('ImpersonationSuccess', {
        user: rawContext.user,
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
      // TODO: rawContext does not contain user and locale date anymore
      // following the type but the code still depends on it
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

    logout: async ({ token, loginToken, userId }) => {
      try {
        if (!token && !loginToken) return { success: false, error: null };
        await accountsServer.logout({
          token: token || accountsServer.hashLoginToken(loginToken),
          userId,
        });
        return {
          success: true,
          error: null,
        };
      } catch (error) {
        return {
          success: false,
          error,
        };
      }
    },

    // User management
    setUsername: (_id, username) => dbManager.setUsername(_id, username),
    setPassword: async (userId, { newPlainPassword }) => {
      const newPassword = newPlainPassword ? hashPassword(newPlainPassword) : uuidv4().split('-').pop();
      await accountsPassword.setPassword(userId, newPassword);
    },

    changePassword: async (userId, { newPlainPassword, oldPlainPassword }) => {
      const newPassword = hashPassword(newPlainPassword);
      const oldPassword = hashPassword(oldPlainPassword);

      await accountsPassword.changePassword(userId, oldPassword, newPassword);
      return true;
    },
    sendResetPasswordEmail: async (email) => {
      await accountsPassword.sendResetPasswordEmail(email);
      return true;
    },

    resetPassword: async ({ newPlainPassword, token }, context) => {
      const user = await dbManager.findUserByResetPasswordToken(token);
      const newPassword = hashPassword(newPlainPassword);
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
      return true;
    },

    webAuthn,
    oAuth2,
  };
};
