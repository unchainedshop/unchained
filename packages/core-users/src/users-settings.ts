import { insensitiveTrimmedRegexOperator, mongodb } from '@unchainedshop/mongodb';
import { User } from './db/UsersCollection.js';

export interface UserRegistrationData extends Partial<User> {
  email?: string;
  password: string | null;
  webAuthnPublicKeyCredentials?: any;
}
export interface UserSettingsOptions {
  mergeUserCartsOnLogin?: boolean;
  autoMessagingAfterUserCreation?: boolean;
  validateEmail?: (email: string) => Promise<boolean>;
  validateUsername?: (username: string) => Promise<boolean>;
  validateNewUser?: (user: UserRegistrationData) => Promise<UserRegistrationData>;
  validatePassword?: (password: string) => Promise<boolean>;
}
export interface UserSettings {
  mergeUserCartsOnLogin: boolean;
  autoMessagingAfterUserCreation: boolean;
  validateEmail: (email: string) => Promise<boolean>;
  validateUsername: (username: string) => Promise<boolean>;
  validateNewUser: (user: UserRegistrationData) => Promise<UserRegistrationData>;
  validatePassword: (password: string) => Promise<boolean>;
  configureSettings: (options: UserSettingsOptions, db: mongodb.Db) => void;
}

export const userSettings: UserSettings = {
  autoMessagingAfterUserCreation: null,
  mergeUserCartsOnLogin: null,
  validateEmail: null,
  validateUsername: null,
  validateNewUser: null,
  validatePassword: null,

  configureSettings: (
    {
      mergeUserCartsOnLogin,
      autoMessagingAfterUserCreation,
      validateEmail,
      validateUsername,
      validateNewUser,
      validatePassword,
    }: UserSettingsOptions,
    db: mongodb.Db,
  ) => {
    const defaultAutoMessagingAfterUserCreation = true;
    const defaultMergeUserCartsOnLogin = true;

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
    userSettings.validateEmail = validateEmail || defaultValidateEmail;
    userSettings.validateUsername = validateUsername || defaultValidateUsername;
    userSettings.validateNewUser = validateNewUser || defaultValidateNewUser;
    userSettings.validatePassword = validatePassword || defaultValidatePassword;
  },
};
