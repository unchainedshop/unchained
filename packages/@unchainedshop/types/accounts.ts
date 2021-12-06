import { Context } from './api';
import { User, UserProfile } from './user';

interface EmailData {
  email: string;
  verified?: boolean;
}

export interface AccountsOptions {
  autoMessagingAfterUserCreation?: boolean
}

export interface AccountsModule {
  // Mutations
  createUser: (
    userData: {
      username: string;
      email: string;
      password: string;
      plainPassword: string;
      profile: UserProfile;
    },
    context: any,
    options: { skipMessaging?: boolean }
  ) => Promise<string>;

  // Email
  addEmail: (userId: string, emailData: EmailData) => Promise<void>;
  removeEmail: (userId: string, emailData: EmailData) => Promise<void>;
  updateEmail: (userId: string, emailData: EmailData, user: User) => Promise<void>;

  // Authentication
  createLogintoken: (
    user: User,
    context: Context
  ) => Promise<{
    id: string;
    token: string;
    tokenExpires: Date;
    user?: User;
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
    user?: User;
  }>;

  setPassword: (userId: string, password: string) => Promise<void>;
  setUsername: (userId: string, username: string) => Promise<void>;

  // TOTP
  buildTOTPSecret: () => string;
  enableTOTP: (userId: string, secret: string, code: string) => Promise<boolean>;
  disableTOTP: (userId: string, code: string) => Promise<boolean>;
};

