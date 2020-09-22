import { AccountsServer } from '@accounts/server';
import { AccountsPassword } from '@accounts/password';
import MongoDBInterface from '@accounts/mongo';
import { MongoInternals } from 'meteor/mongo';
import { DatabaseManager } from '@accounts/database-manager';
import { Random } from 'meteor/random';
import crypto, { randomBytes } from 'crypto';
// import { destroyToken, hashLoginToken } from './util';

const METEOR_ID_LENGTH = 17;

export const idProvider = () =>
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
  },
);

const dbManager = new DatabaseManager({
  sessionStorage: mongoStorage,
  userStorage: mongoStorage,
});

const options = {
  siteUrl: Meteor.absoluteUrl(),
  // sendVerificationEmailAfterSignup: false, // It's set to false by default
};

class UnchainedAccountsPassword extends AccountsPassword {}

export const accountsPassword = new UnchainedAccountsPassword({});

class UnchainedAccountsServer extends AccountsServer {
  destroyToken = (userId, loginToken) => {
    this.users.update(userId, {
      $pull: {
        'services.resume.loginTokens': {
          $or: [{ hashedToken: loginToken }, { token: loginToken }],
        },
      },
    });
  };

  hashLoginToken = (stampedToken) => {
    const { token, when } = stampedToken;
    const hash = crypto.createHash('sha256');
    hash.update(token);
    const hashedToken = hash.digest('base64');

    return {
      when,
      hashedToken,
    };
  };

  // We override the loginWithUser to use Meteor specific mechanism instead of accountjs JWT
  // https://github.com/accounts-js/accounts/blob/7f4da2d34a88fbf77cccbff799d2a59ce43649b6/packages/server/src/accounts-server.ts#L263
  async loginWithUser(user) {
    const stampedLoginToken = {
      token: Random.secret(),
      when: new Date(new Date().getTime() + 1000000),
    };

    const token = this.hashLoginToken(stampedLoginToken);

    Meteor.users.update(
      { _id: user._id },
      {
        $addToSet: {
          'services.resume.loginTokens': token,
        },
      },
    );

    // Take note we returen the stamped token but store the hashed on in the db
    return {
      token: {
        when: token.when,
        token: stampedLoginToken.token,
      },
      user,
    };
  }
}

export const accountsServer = new UnchainedAccountsServer(
  { db: dbManager, ...options },
  {
    password: accountsPassword,
  },
);
