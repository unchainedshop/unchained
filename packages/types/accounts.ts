import { User as AccountsUser } from '@accounts/types';
import { Context } from './api';
import { User, UserProfile } from './user';

export interface UserData {
  email?: string;
  guest?: boolean;
  initialPassword?: boolean;
  lastBillingAddress: User['lastBillingAddress'];
  password: string | null;
  plainPassword?: string;
  profile?: UserProfile;
  roles?: Array<string>;
  username?: string;
}

/*
 * Settings
 */

export interface AccountsSettingsOptions {
  autoMessagingAfterUserCreation?: boolean;
  mergeUserCartsOnLogin?: boolean;
  server?: any;
  password?: any;
}
export interface AccountsSettings {
  autoMessagingAfterUserCreation: boolean;
  mergeUserCartsOnLogin: boolean;
  configureSettings: (options: AccountsSettingsOptions, context: any) => void;
}

/*
 * Module
 */

export interface AccountsModule {
  dbManager: any;

  getAccountsServer: () => any;

  emit: (event: string, meta: any) => Promise<void>;

  // Mutations
  createUser: (userData: UserData, options: { skipMessaging?: boolean }) => Promise<string>;

  // Email
  addEmail: (userId: string, email: string) => Promise<void>;
  removeEmail: (userId: string, email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  findUnverifiedUserByToken: (token: string) => Promise<AccountsUser>;
  findUserByEmail: (email: string) => Promise<User>;
  findUserByUsername: (username: string) => Promise<User>;

  sendVerificationEmail: (email: string) => Promise<void>;
  sendEnrollmentEmail: (email: string) => Promise<void>;

  // Authentication
  createLoginToken: (
    userId: string,
    context: Context,
  ) => Promise<{
    id: string;
    token: string;
    tokenExpires: Date;
  }>;
  createImpersonationToken: (
    userId: string,
    context: Context,
  ) => Promise<{
    id: string;
    token: string;
    tokenExpires: Date;
  }>;
  loginWithService: (
    params:
      | { service: 'guest' }
      | {
          service: 'password';
          user: { email: string } | { username: string };
          password: string;
          code?: string;
        },
    context: Context,
  ) => Promise<{
    id: string;
    token: string;
    tokenExpires: Date;
  }>;
  logout: (params: { token?: string }, context: Context) => Promise<{ success: boolean; error: any }>;
  createHashLoginToken: (loginToken: string) => string;

  // User Management
  setUsername: (userId: string, username: string) => Promise<void>;
  setPassword: (
    userId: string,
    params: {
      newPassword?: string;
      newPlainPassword?: string;
    },
  ) => Promise<void>;
  changePassword: (
    userId: string,
    params: {
      newPassword?: string;
      newPlainPassword?: string;
      oldPassword?: string;
      oldPlainPassword?: string;
    },
  ) => Promise<boolean>;
  resetPassword: (
    params: { newPassword?: string; newPlainPassword?: string; token: string },
    context: Context,
  ) => Promise<AccountsUser>;
  sendResetPasswordEmail: (email: string) => Promise<boolean>;

  // TOTP
  buildTOTPSecret: () => string;
  enableTOTP: (userId: string, secret: string, code: string) => Promise<boolean>;
  disableTOTP: (userId: string, code: string) => Promise<boolean>;
}
