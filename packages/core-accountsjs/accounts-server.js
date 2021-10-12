import { AccountsServer, ServerHooks } from '@accounts/server';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import crypto from 'crypto';
import { randomValueHex } from './helpers';
import { dbManager } from './db-manager';
import { accountsPassword } from './accounts-password';

const accountsServerOptions = {
  useInternalUserObjectSanitizer: false,
  siteUrl: process.env.ROOT_URL,
  prepareMail: (to, token, user, pathFragment) => {
    return {
      template: 'ACCOUNT_ACTION',
      recipientEmail: to,
      action: pathFragment,
      userId: user.id || user._id,
      token,
      skipMessaging: !!user.guest && pathFragment === 'verify-email',
    };
  },
  sendMail: (input) => {
    if (!input) return true;
    if (input.skipMessaging) return true;

    return WorkerDirector.addWork({
      type: 'MESSAGE',
      retries: 0,
      input,
    });
  },
};

export class UnchainedAccountsServer extends AccountsServer {
  DEFAULT_LOGIN_EXPIRATION_DAYS = 30;

  LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100;

  destroyToken = async (userId, loginToken) => {
    this.users.update(
      { _id: userId },
      {
        $pull: {
          'services.resume.loginTokens': {
            $or: [{ hashedToken: loginToken }, { token: loginToken }],
          },
        },
      }
    );
  };

  async removeExpiredTokens(userId) {
    const tokenLifetimeMs = this.getTokenLifetimeMs();
    const oldestValidDate = new Date(new Date() - tokenLifetimeMs);
    await this.users.update(
      {
        _id: userId,
        $or: [
          { 'services.resume.loginTokens.when': { $lt: oldestValidDate } },
          { 'services.resume.loginTokens.when': { $lt: +oldestValidDate } },
        ],
      },
      {
        $pull: {
          'services.resume.loginTokens': {
            $or: [
              { when: { $lt: oldestValidDate } },
              { when: { $lt: +oldestValidDate } },
            ],
          },
        },
      },
      { multi: true }
    );
  }

  getTokenLifetimeMs() {
    const loginExpirationInDays =
      this.options.loginExpirationInDays === null
        ? this.LOGIN_UNEXPIRING_TOKEN_DAYS
        : this.options.loginExpirationInDays;
    return (
      (loginExpirationInDays || this.DEFAULT_LOGIN_EXPIRATION_DAYS) *
      24 *
      60 *
      60 *
      1000
    );
  }

  hashLoginToken = (stampedLoginToken) => {
    const hash = crypto.createHash('sha256');
    hash.update(stampedLoginToken);
    const hashedToken = hash.digest('base64');

    return hashedToken;
  };

  // We override the loginWithUser to use Meteor specific mechanism instead of accountjs JWT
  // https://github.com/accounts-js/accounts/blob/7f4da2d34a88fbf77cccbff799d2a59ce43649b6/packages/server/src/accounts-server.ts#L263
  async loginWithUser(user) {
    // Random.secret uses a default value of 43
    // https://github.com/meteor/meteor/blob/devel/packages/random/AbstractRandomGenerator.js#L78
    const date = new Date();

    const when = new Date(date.getTime() + this.getTokenLifetimeMs());
    const stampedLoginToken = randomValueHex(43);
    const userId = user._id ? user._id : user;
    const hashedToken = this.hashLoginToken(stampedLoginToken);
    await this.removeExpiredTokens(userId);
    await this.users.update(
      { _id: userId }, // can be user object or mere id passed by guest service
      {
        $push: {
          'services.resume.loginTokens': {
            $each: [{ hashedToken, when }],
            $slice: -100,
          },
        },
      }
    );

    // Take note we returen the stamped token but store the hashed on in the db
    return {
      token: {
        when,
        token: stampedLoginToken,
      },
      user,
    };
  }

  async logout({ userId, token }) {
    try {
      await this.destroyToken(userId, token);
      this.hooks.emit(ServerHooks.LogoutSuccess, {
        user: this.users.findOne({ _id: userId }),
      });
    } catch (error) {
      this.hooks.emit(ServerHooks.LogoutError, error);
      throw error;
    }
  }
}

// eslint-disable-next-line import/prefer-default-export
export const accountsServer = new UnchainedAccountsServer(
  {
    db: dbManager,
    ...accountsServerOptions,
  },
  {
    password: accountsPassword,
  }
);
