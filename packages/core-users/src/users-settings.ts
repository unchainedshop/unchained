import { insensitiveTrimmedRegexOperator, mongodb } from '@unchainedshop/mongodb';
import { User } from './db/UsersCollection.js';

export interface UserRegistrationData extends Partial<User> {
  email?: string;
  password: string | null;
  webAuthnPublicKeyCredentials?: any;
}

export enum UserAccountAction {
  RESET_PASSWORD = 'reset-password',
  VERIFY_EMAIL = 'verify-email',
  ENROLL_ACCOUNT = 'enroll-account',
  PASSWORD_RESETTED = 'password-resetted',
  EMAIL_VERIFIED = 'email-verified',
}
export interface UserSettingsOptions {
  mergeUserCartsOnLogin?: boolean;
  autoMessagingAfterUserCreation?: boolean;
  /**
   * Function to calculate the earliest valid token date. Defaults to 1h if not set.
   * @param type The type of user account action.
   * @returns A date. All tokens created after that date are considered valid.
   */
  earliestValidTokenDate?: (
    type: UserAccountAction.VERIFY_EMAIL | UserAccountAction.RESET_PASSWORD,
  ) => Date;
  validateEmail?: (email: string) => Promise<boolean>;
  validateUsername?: (username: string) => Promise<boolean>;
  validateNewUser?: (user: UserRegistrationData) => Promise<UserRegistrationData>;
  validatePassword?: (password: string) => Promise<boolean>;
}
export interface UserSettings {
  mergeUserCartsOnLogin: boolean;
  autoMessagingAfterUserCreation: boolean;
  earliestValidTokenDate: (
    type: UserAccountAction.VERIFY_EMAIL | UserAccountAction.RESET_PASSWORD,
  ) => Date;
  validateEmail: (email: string) => Promise<boolean>;
  validateUsername: (username: string) => Promise<boolean>;
  validateNewUser: (user: UserRegistrationData) => Promise<UserRegistrationData>;
  validatePassword: (password: string) => Promise<boolean>;
  configureSettings: (options: UserSettingsOptions, db: mongodb.Db) => void;
}

export const userSettings: UserSettings = {
  autoMessagingAfterUserCreation: null,
  mergeUserCartsOnLogin: null,
  earliestValidTokenDate: null,
  validateEmail: null,
  validateUsername: null,
  validateNewUser: null,
  validatePassword: null,

  configureSettings: (
    {
      mergeUserCartsOnLogin,
      autoMessagingAfterUserCreation,
      earliestValidTokenDate,
      validateEmail,
      validateUsername,
      validateNewUser,
      validatePassword,
    }: UserSettingsOptions,
    db: mongodb.Db,
  ) => {
    const defaultAutoMessagingAfterUserCreation = true;
    const defaultMergeUserCartsOnLogin = true;

    const defaultEarliestValidTokenDate = () => {
      // 1 hour ago
      return new Date(new Date().getTime() - 1000 * 60 * 60);
    };

    const defaultValidateEmail = async (rawEmail: string) => {
      if (!rawEmail?.includes?.('@')) return false;
      const emailAlreadyExists = await db
        .collection('users')
        .countDocuments({ 'emails.address': insensitiveTrimmedRegexOperator(rawEmail) }, { limit: 1 });
      if (emailAlreadyExists) return false;
      return true;
    };
    const defaultValidateUsername = async (rawUsername: string) => {
      if (rawUsername?.length < 3) return false;
      const usernameAlreadyExists = await db
        .collection('users')
        .countDocuments({ username: insensitiveTrimmedRegexOperator(rawUsername) }, { limit: 1 });
      if (usernameAlreadyExists) return false;
      return true;
    };
    const defaultValidateNewUser = async (user: UserRegistrationData) => {
      return {
        ...user,
        username: user.username?.trim().toLowerCase(),
        email: user.email?.trim().toLowerCase(),
        password: user.password ?? null,
      };
    };

    const defaultValidatePassword = async (password: string) => {
      return password?.length >= 8;
    };

    userSettings.mergeUserCartsOnLogin = mergeUserCartsOnLogin ?? defaultMergeUserCartsOnLogin;
    userSettings.autoMessagingAfterUserCreation =
      autoMessagingAfterUserCreation ?? defaultAutoMessagingAfterUserCreation;
    userSettings.earliestValidTokenDate = earliestValidTokenDate || defaultEarliestValidTokenDate;
    userSettings.validateEmail = validateEmail || defaultValidateEmail;
    userSettings.validateUsername = validateUsername || defaultValidateUsername;
    userSettings.validateNewUser = validateNewUser || defaultValidateNewUser;
    userSettings.validatePassword = validatePassword || defaultValidatePassword;
  },
};
