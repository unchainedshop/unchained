import { AccountsServer, ServerHooks } from '@accounts/server';
import { AccountsPassword } from '@accounts/password';
import MongoDBInterface from '@accounts/mongo';
import { MongoInternals } from 'meteor/mongo';
import { DatabaseManager } from '@accounts/database-manager';
import crypto, { randomBytes } from 'crypto';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export const randomValueHex = (len) => {
  return crypto
    .randomBytes(Math.ceil(len / 2))
    .toString('hex') // convert to hexadecimal format
    .slice(0, len); // return required number of characters
};

const METEOR_ID_LENGTH = 17;

const idProvider = () =>
  randomBytes(30)
    .toString('base64')
    .replace(/[\W_]+/g, '')
    .substr(0, METEOR_ID_LENGTH);

const dateProvider = (date) => date || new Date();

const mongoStorage = new MongoDBInterface(
  MongoInternals.defaultRemoteCollectionDriver().mongo.db,
  {
    convertUserIdToMongoObjectId: false,
    convertSessionIdToMongoObjectId: false,
    idProvider,
    dateProvider,
  }
);

export const dbManager = new DatabaseManager({
  sessionStorage: mongoStorage,
  userStorage: mongoStorage,
});

const accountsServerOptions = {
  siteUrl: process.env.ROOT_URL,
  prepareMail: (to, token, user, pathFragment, emailTemplate, from) => {
    if (token && pathFragment) {
      const actionsSet = {
        'verify-email': 'verifyEmail',
        'enroll-account': 'enrollAccount',
        'reset-password': 'resetPassword',
      };

      return {
        recipientEmail: to,
        action: actionsSet[pathFragment],
        userId: user.id || user._id,
        token,
      };
    }
  },
  sendMail: ({ action, userId, token, recipientEmail }) => {
    return WorkerDirector.addWork({
      type: 'MESSAGE',
      retries: 0,
      input: {
        template: 'ACCOUNT_ACTION',
        action,
        recipientEmail,
        userId,
        token,
      },
    });
  },
};

class UnchainedAccountsPassword extends AccountsPassword {}

export const accountsPassword = new UnchainedAccountsPassword({
  sendVerificationEmailAfterSignup: true,
});

class UnchainedAccountsServer extends AccountsServer {
  DEFAULT_LOGIN_EXPIRATION_DAYS = 90;

  LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100;

  destroyToken = (userId, loginToken) => {
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
    const when = new Date(new Date().getTime() + 1000000);
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
      this.destroyToken(userId, token);
      this.hooks.emit(ServerHooks.LogoutSuccess, {
        user: this.users.findOne({ _id: userId }),
      });
    } catch (error) {
      this.hooks.emit(ServerHooks.LogoutError, error);
      throw error;
    }
  }
}

export const accountsServer = new UnchainedAccountsServer(
  {
    db: dbManager,
    ...accountsServerOptions,
  },
  {
    password: accountsPassword,
  }
);
