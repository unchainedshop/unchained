import { User as AccountsUser } from '@accounts/types';
import { Context } from './api';
import { User, UserProfile } from './user';

export interface WebAuthnCredentialsCreationRequest {
  challenge: string;
  username: string;
  origin: string;
  factor: 'first' | 'second' | 'either';
}

export interface UserData {
  email?: string;
  guest?: boolean;
  initialPassword?: boolean;
  lastBillingAddress?: User['lastBillingAddress'];
  password: string | null;
  plainPassword?: string;
  webAuthnPublicKeyCredentials?: any;
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

export interface AccountsWebAuthnModule {
  findMDSMetadataForAAGUID: (aaguid: string) => Promise<any>;

  createCredentialCreationOptions: (
    origin: string,
    username: string,
    extensionOptions?: any,
  ) => Promise<any>;
  verifyCredentialCreation: (username: string, credentials: any) => Promise<any>;

  createCredentialRequestOptions: (
    origin: string,
    username?: string,
    extensionOptions?: any,
  ) => Promise<any>;
  verifyCredentialRequest: (userPublicKeys: any[], username: string, credentials: any) => Promise<any>;
}

export type LoginWithParams<N, T> = {
  service: N;
} & T;

export type LoginWithGuestParams = LoginWithParams<'guest', Record<string, never>>;

export type LoginWithPassword = {
  user: { email: string } | { username: string };
  password: string;
  code?: string;
};

export type LoginWithPasswordParams = LoginWithParams<'password', LoginWithPassword>;

export interface AccountsModule {
  dbManager: any;

  getAccountsServer: () => any;

  emit: (event: string, meta: any) => Promise<void>;

  // Mutations
  createUser: (
    userData: UserData,
    options: { skipMessaging?: boolean; skipPasswordEnrollment?: boolean },
  ) => Promise<string>;

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
      | LoginWithGuestParams
      | LoginWithPasswordParams
      | LoginWithParams<string, Record<string, any>>,
    context: Context,
  ) => Promise<{
    id: string;
    token: string;
    tokenExpires: Date;
  }>;
  logout: (params: { token?: string }, context: Context) => Promise<{ success: boolean; error?: any }>;
  createHashLoginToken: (loginToken: string) => string;

  // User Management
  setUsername: (userId: string, username: string) => Promise<void>;
  setPassword: (
    userId: string,
    params: {
      newPlainPassword?: string;
    },
  ) => Promise<void>;
  changePassword: (
    userId: string,
    params: {
      newPlainPassword?: string;
      oldPlainPassword?: string;
    },
  ) => Promise<boolean>;
  resetPassword: (
    params: { newPlainPassword?: string; token: string },
    context: Context,
  ) => Promise<AccountsUser>;
  sendResetPasswordEmail: (email: string) => Promise<boolean>;

  // TOTP
  buildTOTPSecret: () => string;
  enableTOTP: (userId: string, secret: string, code: string) => Promise<boolean>;
  disableTOTP: (userId: string, code: string) => Promise<boolean>;

  webAuthn: AccountsWebAuthnModule;
}
