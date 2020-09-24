import { AccountsServer, ServerHooks, AccountsJsError } from '@accounts/server';
import { AccountsPassword } from '@accounts/password';
import MongoDBInterface from '@accounts/mongo';
import { MongoInternals } from 'meteor/mongo';
import { DatabaseManager } from '@accounts/database-manager';
import { Random } from 'meteor/random';
import crypto, { randomBytes } from 'crypto';
import pick from 'lodash.pick';
import defer from 'lodash.defer';

// import { destroyToken, hashLoginToken } from './util';

const CreateUserErrors = {
  /**
   * Will throw if no username or email is provided.
   */
  UsernameOrEmailRequired: 'UsernameOrEmailRequired',
  /**
   * Username validation via option `validateUsername` failed.
   */
  InvalidUsername: 'InvalidUsername',
  /**
   * Email validation via option `validateEmail` failed.
   */
  InvalidEmail: 'InvalidEmail',
  /**
   * Password validation via option `validatePassword` failed.
   */
  InvalidPassword: 'InvalidPassword',
  /**
   * Email already exist in the database.
   */
  EmailAlreadyExists: 'EmailAlreadyExists',
  /**
   * Username already exist in the database.
   */
  UsernameAlreadyExists: 'UsernameAlreadyExists',
};

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

class UnchainedAccountsPassword extends AccountsPassword {
  async createUser(user, options) {
    if (!user.username && !user.email) {
      throw new AccountsJsError(
        this.options.errors.usernameOrEmailRequired,
        CreateUserErrors.UsernameOrEmailRequired,
      );
    }

    if (user.username && !this.options.validateUsername(user.username)) {
      throw new AccountsJsError(
        this.options.errors.invalidUsername,
        CreateUserErrors.InvalidUsername,
      );
    }

    if (user.email && !this.options.validateEmail(user.email)) {
      throw new AccountsJsError(
        this.options.errors.invalidEmail,
        CreateUserErrors.InvalidEmail,
      );
    }

    if (user.username && (await this.db.findUserByUsername(user.username))) {
      throw new AccountsJsError(
        this.options.errors.usernameAlreadyExists,
        CreateUserErrors.UsernameAlreadyExists,
      );
    }

    if (user.email && (await this.db.findUserByEmail(user.email))) {
      throw new AccountsJsError(
        this.options.errors.emailAlreadyExists,
        CreateUserErrors.EmailAlreadyExists,
      );
    }

    if (user.password) {
      if (!this.options.validatePassword(user.password)) {
        throw new AccountsJsError(
          this.options.errors.invalidPassword,
          CreateUserErrors.InvalidPassword,
        );
      }
      user.password = await this.options.hashPassword(user.password);
    }

    // If user does not provide the validate function only allow some fields
    user = this.options.validateNewUser
      ? await this.options.validateNewUser(user)
      : pick(user, ['username', 'email', 'password']);

    try {
      const userId = await this.db.createUser(user);

      defer(async () => {
        if (this.options.sendVerificationEmailAfterSignup && user.email)
          this.sendVerificationEmail(user.email);

        const userRecord = await this.db.findUserById(userId);
        this.server
          .getHooks()
          .emit(ServerHooks.CreateUserSuccess, { user: userRecord, options });
      });

      return userId;
    } catch (e) {
      await this.server.getHooks().emit(ServerHooks.CreateUserError, user);
      throw e;
    }
  }
}

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
