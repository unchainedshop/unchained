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
  DEFAULT_LOGIN_EXPIRATION_DAYS = 90;

  LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100;

  destroyToken = async (userId, loginToken) => {
    this.users.update(userId, {
      $pull: {
        'services.resume.loginTokens': {
          $or: [{ hashedToken: loginToken }, { token: loginToken }],
        },
      },
    });
  };

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

  tokenExpiration(when) {
    // We pass when through the Date constructor for backwards compatibility;
    // `when` used to be a number.
    return new Date(new Date(when).getTime() + this.getTokenLifetimeMs());
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
    const numberOfDaysToAdd = 30;

    const when = new Date(date.setDate(date.getDate() + numberOfDaysToAdd));
    const stampedLoginToken = randomValueHex(43);

    const hashedToken = this.hashLoginToken(stampedLoginToken);
    this.users.update(
      { _id: user._id || user }, // can be user object or mere id passed by guest service
      {
        $addToSet: {
          'services.resume.loginTokens': { hashedToken, when },
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
