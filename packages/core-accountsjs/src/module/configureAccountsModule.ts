import {
  AccountsModule,
  AccountsSettingsOptions,
} from '@unchainedshop/types/accounts';
import { log, LogLevel } from 'meteor/unchained:logger';
import { v4 as uuidv4 } from 'uuid';
import { accountsSettings } from '../accounts-settings';
import { accountsServer } from '../accounts/accountsServer';
import { accountsPassword } from '../accounts/accountsPassword';
import { dbManager } from '../accounts/dbManager';
import { evaluateContext } from './utils/evaluateContext';
import { filterContext } from './utils/filterContext';
import { hashPassword } from './utils/hashPassword';

export const configureAccountsModule = async (): Promise<AccountsModule> => {
  return {
    emit: async (event, meta) =>
      await accountsServer.getHooks().emit(event, meta),

    // Mutations
    createUser: async (userData, options = {}) => {
      const userId = await accountsPassword.createUser(userData);

      const autoMessagingEnabled = options.skipMessaging
        ? false
        : accountsSettings.autoMessagingAfterUserCreation &&
          !!userData.email &&
          !!userId;

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
    addEmail: async (userId, email) =>
      await accountsPassword.addEmail(userId, email, false),
    removeEmail: async (userId, email) =>
      await accountsPassword.removeEmail(userId, email),
    updateEmail: async (userId, email, user) => {
      log(
        'user.updateEmail is deprecated, please use user.addEmail and user.removeEmail',
        { level: LogLevel.Warning }
      );

      await accountsPassword.addEmail(userId, email, false);
      await Promise.all(
        (user.emails || [])
          .filter(
            ({ address }) => address.toLowerCase() !== email.toLowerCase()
          )
          .map(({ address }) => accountsPassword.removeEmail(userId, address))
      );
    },

    findUnverifiedUserByToken: async (token) =>
      await dbManager.findUserByEmailVerificationToken(token),

    sendVerificationEmail: async (email) =>
      await accountsPassword.sendVerificationEmail(email),
    sendEnrollmentEmail: async (email) =>
      await accountsPassword.sendEnrollmentEmail(email),

    verifyEmail: async (token) => await accountsPassword.verifyEmail(token),

    // Autentication
    createLoginToken: async (userId, rawContext) => {
      const context = evaluateContext(filterContext(rawContext));

      const { user: tokenUser, token: loginToken } =
        await accountsServer.loginWithUser(userId);

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

    createHashLoginToken: (loginToken) =>
      accountsServer.hashLoginToken(loginToken),

    loginWithService: async (params, rawContext) => {
      const context = evaluateContext(filterContext(rawContext));

      const { user: tokenUser, token: loginToken } =
        await accountsServer.loginWithService(params.service, params, context);

      await accountsServer.getHooks().emit('LoginTokenCreated', {
        userId: tokenUser._id,
        user: tokenUser,
        connection: context,
        service: params.service,
      });

      return {
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
    setUsername: async (_id, username) =>
      await dbManager.setUsername(_id, username),
    setPassword: async (
      userId,
      { newPassword: newHashedPassword, newPlainPassword }
    ) => {
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
      }
    ) => {
      const newPassword = newHashedPassword || hashPassword(newPlainPassword);
      const oldPassword = oldHashedPassword || hashPassword(oldPlainPassword);

      const success = await accountsPassword
        .changePassword(userId, oldPassword, newPassword)
        .then(() => true) // Map null to success
        .catch((error: Error) => {
          log('Error while changing password', {
            level: LogLevel.Error,
            ...error,
          });
          return false;
        });
      return success;
    },
    sendResetPasswordEmail: async (email) =>
      await accountsPassword
        .sendResetPasswordEmail(email)
        .then(() => true) // Map null to success
        .catch((error: Error) => {
          log('Error while sending reset password', {
            level: LogLevel.Error,
            ...error,
            email,
          });
          return false;
        }),

    resetPassword: async (
      { newPassword: newHashedPassword, newPlainPassword, token },
      context
    ) => {
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
  };
};
