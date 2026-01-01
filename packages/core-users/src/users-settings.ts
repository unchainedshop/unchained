import type { DrizzleDb } from '@unchainedshop/store';
import { sql } from 'drizzle-orm';
import type { User } from './module/configureUsersModule.ts';

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
  configureSettings: (options: UserSettingsOptions, db?: DrizzleDb) => void;
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
  // Require at least 12 characters
  if (!password || password.length < 12) return false;

  // Require at least one uppercase letter
  if (!/[A-Z]/.test(password)) return false;

  // Require at least one lowercase letter
  if (!/[a-z]/.test(password)) return false;

  // Require at least one number
  if (!/[0-9]/.test(password)) return false;

  return true;
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
    db?: DrizzleDb,
  ) => {
    const defaultValidateEmail = async (rawEmail: string) => {
      if (!rawEmail?.includes?.('@')) return false;
      if (!db) return true;
      // Check if email already exists (case-insensitive)
      const [existing] = await db.all(sql`
        SELECT 1 FROM users
        WHERE EXISTS (
          SELECT 1 FROM json_each(emails)
          WHERE lower(json_extract(value, '$.address')) = lower(${rawEmail.trim()})
        )
        LIMIT 1
      `);
      if (existing) return false;
      return true;
    };

    const defaultValidateUsername = async (rawUsername: string) => {
      if (rawUsername?.length < 3) return false;
      if (!db) return true;
      // Check if username already exists (case-insensitive)
      const [existing] = await db.all(sql`
        SELECT 1 FROM users
        WHERE lower(username) = lower(${rawUsername.trim()})
        LIMIT 1
      `);
      if (existing) return false;
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
