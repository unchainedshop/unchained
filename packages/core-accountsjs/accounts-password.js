import { ServerHooks, AccountsJsError } from '@accounts/server';
import { AccountsPassword } from '@accounts/password';
import defer from 'lodash.defer';
import CreateUserErrors from './errors';

class UnchainedAccountsPassword extends AccountsPassword {
  async createUser(user, options) {
    if (!user.username && !user.email) {
      throw new AccountsJsError(
        this.options.errors.usernameOrEmailRequired,
        CreateUserErrors.UsernameOrEmailRequired
      );
    }

    if (user.username && !this.options.validateUsername(user.username)) {
      throw new AccountsJsError(
        this.options.errors.invalidUsername,
        CreateUserErrors.InvalidUsername
      );
    }

    if (user.email && !this.options.validateEmail(user.email)) {
      throw new AccountsJsError(
        this.options.errors.invalidEmail,
        CreateUserErrors.InvalidEmail
      );
    }

    if (user.username && (await this.db.findUserByUsername(user.username))) {
      throw new AccountsJsError(
        this.options.errors.usernameAlreadyExists,
        CreateUserErrors.UsernameAlreadyExists
      );
    }

    if (user.email && (await this.db.findUserByEmail(user.email))) {
      throw new AccountsJsError(
        this.options.errors.emailAlreadyExists,
        CreateUserErrors.EmailAlreadyExists
      );
    }

    if (user.password) {
      if (!this.options.validatePassword(user.password)) {
        throw new AccountsJsError(
          this.options.errors.invalidPassword,
          CreateUserErrors.InvalidPassword
        );
      }
      user.password = await this.options.hashPassword(user.password);
    }
    const { username, email, password } = user;
    // If user does not provide the validate function only allow some fields
    user = this.options.validateNewUser
      ? await this.options.validateNewUser(user)
      : { username, email, password };

    try {
      const userId = await this.db.createUser(user);

      defer(async () => {
        if (
          !options?.skipEmailVerification && // if skipEmailVerification isn't provided
          this.options.sendVerificationEmailAfterSignup &&
          user.email
        )
          this.sendVerificationEmail(user.email);

        const userRecord = await this.db.findUserById(userId);
        this.server.getHooks().emit(ServerHooks.CreateUserSuccess, userRecord);
      });

      return userId;
    } catch (e) {
      await this.server.getHooks().emit(ServerHooks.CreateUserError, user);
      throw e;
    }
  }
}

// eslint-disable-next-line import/prefer-default-export
export const accountsPassword = new UnchainedAccountsPassword({});
