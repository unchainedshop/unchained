import crypto from 'crypto';
import { AccountsServer, ServerHooks } from '@accounts/server';
import { randomValueHex } from '@unchainedshop/utils';
import { User } from '@unchainedshop/types/user.js';

export class UnchainedAccountsServer extends AccountsServer<
  User & { id: string; deactivated: boolean }
> {
  public users;

  DEFAULT_LOGIN_EXPIRATION_DAYS = 30;

  LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100;

  destroyToken = async (userId, loginToken) => {
    await this.users.updateUser(
      { _id: userId },
      {
        $pull: {
          'services.resume.loginTokens': {
            $or: [{ hashedToken: loginToken }, { token: loginToken }],
          },
        },
      },
    );
  };

  async removeExpiredTokens(userId) {
    const tokenLifetimeMs = this.getTokenLifetimeMs();
    const oldestValidDate = new Date(new Date().getTime() - tokenLifetimeMs);
    await this.users.updateUser(
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
            $or: [{ when: { $lt: oldestValidDate } }, { when: { $lt: +oldestValidDate } }],
          },
        },
      },
    );
  }

  getTokenLifetimeMs() {
    const options = this.options as any; // we know that loginExpirationInDays can exist!

    const loginExpirationInDays =
      options.loginExpirationInDays === null
        ? this.LOGIN_UNEXPIRING_TOKEN_DAYS
        : options.loginExpirationInDays;
    return (loginExpirationInDays || this.DEFAULT_LOGIN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;
  }

  // eslint-disable-next-line
  hashLoginToken = (stampedLoginToken) => {
    const hash = crypto.createHash('sha256');
    hash.update(stampedLoginToken);
    const hashedToken = hash.digest('base64');

    return hashedToken;
  };

  // We override the loginWithUser to use Meteor specific mechanism instead of accountjs JWT
  // https://github.com/accounts-js/accounts/blob/7f4da2d34a88fbf77cccbff799d2a59ce43649b6/packages/server/src/accounts-server.ts#L263
  // eslint-disable-next-line
  // @ts-ignore : Dirty hack :()
  async loginWithUser(user) {
    // Random.secret uses a default value of 43
    const date = new Date();

    const when = new Date(date.getTime() + this.getTokenLifetimeMs());
    const stampedLoginToken = randomValueHex(43);
    const userId = user._id ? user._id : user;
    const hashedToken = this.hashLoginToken(stampedLoginToken);
    await this.removeExpiredTokens(userId);
    await this.users.updateUser(
      { _id: userId }, // can be user object or mere id passed by guest service
      {
        $push: {
          'services.resume.loginTokens': {
            $each: [{ hashedToken, when }],
            $slice: -100,
          },
        },
      },
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

  // eslint-disable-next-line
  // @ts-ignore : Dirty hack :()
  async logout({ userId, token }) {
    try {
      await this.destroyToken(userId, token);
      // eslint-disable-next-line
      // @ts-ignore
      this.hooks.emit(ServerHooks.LogoutSuccess, {
        user: await this.users.findUserById(userId),
      });
    } catch (error) {
      // eslint-disable-next-line
      // @ts-ignore
      this.hooks.emit(ServerHooks.LogoutError, error);
      throw error;
    }
  }
}
