import { log, LogLevel } from 'meteor/unchained:logger';
import { v4 as uuidv4 } from 'uuid';
import { evaluateContext } from './utils/evaluateContext';
import { filterContext } from './utils/filterContext';
import { AccountsModule, AccountsOptions } from '@unchainedshop/types/accounts';
import { accountsPassword } from '../accounts/accounts-password';
import { accountsServer } from '../accounts/accounts-server';
import { dbManager } from '../accounts/db-manager';

export const configureAccountsModule = async ({
  autoMessagingAfterUserCreation,
}: AccountsOptions): Promise<AccountsModule> => {
  return {
    // Mutations
    createUser: async (userData, options = {}) => {
      const { skipMessaging } = options;
      const userId = await accountsPassword.createUser(userData);
      const autoMessagingEnabled = skipMessaging
        ? false
        : autoMessagingAfterUserCreation && userData.email && userId;

      if (autoMessagingEnabled) {
        if (userData.password === undefined) {
          await accountsPassword.sendEnrollmentEmail(userData.email);
        } else {
          await accountsPassword.sendVerificationEmail(userData.email);
        }
      }
      return userId;
    },

    // Email
    addEmail: async (userId, { email, verified = false }) => {
      await accountsPassword.addEmail(userId, email, verified);
    },
    removeEmail: async (userId, { email }) => {
      await accountsPassword.removeEmail(userId, email);
    },
    updateEmail: async (userId, { email, verified = false }, user) => {
      log(
        'user.updateEmail is deprecated, please use user.addEmail and user.removeEmail',
        { level: LogLevel.Warning }
      );

      await accountsPassword.addEmail(userId, email, verified);
      await Promise.all(
        (user.emails || [])
          .filter(
            ({ address }) => address.toLowerCase() !== email.toLowerCase()
          )
          .map(async ({ address }) =>
            accountsPassword.removeEmail(userId, address)
          )
      );
    },

    // Autentication
    createLogintoken: async (user, rawContext) => {
      const context = evaluateContext(filterContext(rawContext));
      const { user: tokenUser, token: loginToken } =
        await accountsServer.loginWithUser(user);
      await accountsServer.getHooks().emit('LoginTokenCreated', {
        user: tokenUser,
        connection: context,
        service: null,
      });
      return {
        id: tokenUser._id,
        token: loginToken.token,
        tokenExpires: loginToken.when,
      };
    },

    loginWithService: async (service, params, rawContext) => {
      const context = evaluateContext(filterContext(rawContext));

      /* @ts-ignore */
      const { user: tokenUser, token: loginToken } =
        await accountsServer.loginWithService(service, params, context);

      await accountsServer.getHooks().emit('LoginTokenCreated', {
        user: tokenUser,
        connection: context,
        service,
      });

      return {
        /* @ts-ignore */
        id: tokenUser._id,
        token: loginToken.token,
        tokenExpires: loginToken.when,
      };
    },

    setPassword: async (_id, password) => {
      const newPassword = password || uuidv4().split('-').pop();
      await accountsPassword.setPassword(_id, newPassword);
    },

    setUsername: async (_id, username) => {
      await dbManager.setUsername(_id, username);
    },

    // TOTP
    buildTOTPSecret: () => {
      const authSecret = accountsPassword.twoFactor.getNewAuthSecret();
      return authSecret.otpauth_url;
    },

    enableTOTP: async (userId, secret, code) => {
      await accountsPassword.twoFactor.set(
        userId,
        { base32: secret } as any,
        code
      );
      return true;
    },

    disableTOTP: async (userId, code) => {
      await accountsPassword.twoFactor.unset(userId, code);
      // https://github.com/accounts-js/accounts/issues/1181
      const wait = async (time) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(true);
          }, time);
        });
      };
      await wait(500);
      return true;
    },
  };
};
