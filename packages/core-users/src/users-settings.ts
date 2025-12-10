import { insensitiveTrimmedRegexOperator, type mongodb } from '@unchainedshop/mongodb';
import type { User } from './db/UsersCollection.ts';
export interface UserRegistrationData extends Partial<User> {
  email?: string;
  password: string | null;
  webAuthnPublicKeyCredentials?: any;
}

export const UserAccountAction = {
  RESET_PASSWORD: 'reset-password',
  VERIFY_EMAIL: 'verify-email',
  ENROLL_ACCOUNT: 'enroll-account',
  PASSWORD_RESETTED: 'password-resetted',
  EMAIL_VERIFIED: 'email-verified',
} as const;

export type UserAccountAction = (typeof UserAccountAction)[keyof typeof UserAccountAction];
export interface UserSettings {
  mergeUserCartsOnLogin: boolean;
  autoMessagingAfterUserCreation: boolean;
  earliestValidTokenDate: (
    type: typeof UserAccountAction.VERIFY_EMAIL | typeof UserAccountAction.RESET_PASSWORD,
  ) => Date;
  validateEmail: (email: string) => Promise<boolean>;
  validateUsername: (username: string) => Promise<boolean>;
  validateNewUser: (user: UserRegistrationData) => Promise<UserRegistrationData>;
  validatePassword: (password: string) => Promise<boolean>;
  configureSettings: (options: UserSettingsOptions, db: mongodb.Db) => void;
}

export type UserSettingsOptions = Omit<Partial<UserSettings>, 'configureSettings'>;

const defaultAutoMessagingAfterUserCreation = true;
const defaultMergeUserCartsOnLogin = true;

const defaultEarliestValidTokenDate = () => {
  // 1 hour ago
  return new Date(new Date().getTime() - 1000 * 60 * 60);
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

export const userSettings: UserSettings = {
  autoMessagingAfterUserCreation: defaultAutoMessagingAfterUserCreation,
  mergeUserCartsOnLogin: defaultMergeUserCartsOnLogin,
  earliestValidTokenDate: defaultEarliestValidTokenDate,
  validateNewUser: defaultValidateNewUser,
  validateEmail: () => Promise.resolve(true),
  validateUsername: () => Promise.resolve(true),
  validatePassword: () => Promise.resolve(true),

  configureSettings: (
    {
      mergeUserCartsOnLogin,
      autoMessagingAfterUserCreation,
      earliestValidTokenDate,
      validateEmail,
      validateUsername,
      validateNewUser,
      validatePassword,
    },
    db: mongodb.Db,
  ) => {
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
