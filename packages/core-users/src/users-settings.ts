import { mongodb } from '@unchainedshop/mongodb';
import { User } from './db/UsersCollection.js';
export interface UserSettingsOptions {
  mergeUserCartsOnLogin?: boolean;
  autoMessagingAfterUserCreation?: boolean;
  validateEmail?: (email: string) => Promise<boolean>;
  validateUsername?: (username: string) => Promise<boolean>;
  validateNewUser?: (user: Partial<User>) => Promise<User>;
  validatePassword?: (password: string) => Promise<boolean>;
}
export interface UserSettings {
  mergeUserCartsOnLogin: boolean;
  autoMessagingAfterUserCreation: boolean;
  validateEmail: (email: string) => Promise<boolean>;
  validateUsername: (username: string) => Promise<boolean>;
  validateNewUser: (user: Partial<User>) => Promise<User>;
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
      const email = rawEmail.toLowerCase().trim();
      if (!email?.includes?.('@')) return false;
      const emailAlreadyExists = await db
        .collection('users')
        .countDocuments({ 'emails.address': { $regex: email, $options: 'i' } }, { limit: 1 });
      if (emailAlreadyExists) return false;
      return true;
    };
    const defaultValidateUsername = async (rawUsername: string) => {
      const username = rawUsername.toLowerCase().trim();
      if (username?.length < 3) return false;
      const usernameAlreadyExists = await db
        .collection('users')
        .countDocuments({ username: { $regex: username, $options: 'i' } }, { limit: 1 });
      if (usernameAlreadyExists) return false;
      return true;
    };
    const defaultValidateNewUser = async (user: User) => {
      return user;
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
