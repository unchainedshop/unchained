import { Context } from './api';
import { User, UserProfile } from './user';
import { User as AccountsUser } from '@accounts/types';

export interface AccountsOptions {
  autoMessagingAfterUserCreation?: boolean;
}

export interface UserData {
  email?: string;
  initialPassword?: boolean
  password: string;
  plainPassword?: string;
  profile?: UserProfile;
  username?: string;
}

export interface AccountsModule {
  emit: (event: string, meta: any) => Promise<void>;

  // Mutations
  createUser: (
    userData: UserData,
    context: any,
    options: { skipMessaging?: boolean }
  ) => Promise<string>;

  // Email
  addEmail: (userId: string, email: string) => Promise<void>;
  removeEmail: (userId: string, email: string) => Promise<void>;
  updateEmail: (userId: string, email: string, user: User) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  findUnverifiedUserByToken: (token: string) => Promise<AccountsUser>;
  sendVerificationEmail: (email: string) => Promise<void>;

  // Authentication
  createLoginToken: (
    userId: string,
    context: Context
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
    context: Context
  ) => Promise<{
    id: string;
    token: string;
    tokenExpires: Date;
  }>;
  logout: (params: { token?: string }, context: Context) => Promise<{ success: boolean; error: any }>;

  // User Management
  setUsername: (userId: string, username: string) => Promise<void>;
  setPassword: (
    userId: string,
    params: {
      newPassword?: string;
      newPlainPassword?: string;
    }
  ) => Promise<void>;
  changePassword: (
    userId: string,
    params: {
      newPassword?: string;
      newPlainPassword?: string;
      oldPassword?: string;
      oldPlainPassword?: string;
    }
  ) => Promise<void>;
  resetPassword: (
    params: { newPassword?: string; newPlainPassword?: string; token: string },
    context: Context
  ) => Promise<AccountsUser>;
  sendResetPasswordEmail: (email: string) => Promise<boolean>;

  // TOTP
  buildTOTPSecret: () => string;
  enableTOTP: (
    userId: string,
    secret: string,
    code: string
  ) => Promise<boolean>;
  disableTOTP: (userId: string, code: string) => Promise<boolean>;
}
