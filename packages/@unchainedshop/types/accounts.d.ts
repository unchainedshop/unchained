import { Context } from './api';
import { User, UserProfile } from './user';
import { User as AccountsUser } from '@accounts/types';

export interface AccountsOptions {
  autoMessagingAfterUserCreation?: boolean;
}

export interface AccountsModule {
  emit: (event: string, meta: any) => Promise<void>;

  // Mutations
  createUser: (
    userData: {
      email?: string;
      password: string;
      plainPassword?: string;
      profile?: UserProfile;
      username?: string;
    },
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
  createLogintoken: (
    userId: string,
    context: Context
  ) => Promise<{
    id: string;
    token: string;
    tokenExpires: Date;
  }>;
  loginWithService: (
    service: string,
    params:
      | { email: string; password: string; code: string }
      | { username: string; password: string; code: string },
    context: any
  ) => Promise<{
    id: string;
    token: string;
    tokenExpires: Date;
  }>;

  changePassword: (
    userId: string,
    { newPassword: string, newPlainPassword: string,  oldPassword: string, oldPlainPassword: string }
  ) => Promise<void>;
  sendResetPasswordEmail: (email: string) => Promise<void>;
  resetPassword: (
    userId: string,
    { token: string, newPlainPassword: string, newPassword: string }
  ) => Promise<{
    id: string;
    token: string;
    tokenExpires: Date;
  }>;
  setPassword: (userId: string, password: string) => Promise<void>;
  setUsername: (userId: string, username: string) => Promise<void>;

  // TOTP
  buildTOTPSecret: () => string;
  enableTOTP: (
    userId: string,
    secret: string,
    code: string
  ) => Promise<boolean>;
  disableTOTP: (userId: string, code: string) => Promise<boolean>;
}
