import type { User as AccountsUser } from '@accounts/types';
import { IBaseAdapter, IBaseDirector } from './common.js';
import { UnchainedCore } from './core.js';
import { User, UserProfile } from './user.js';

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

export type AccessToken = {
  access_token: string;
  expires_in: string;
  refresh_token: string;
  token_type: string;
  id_token: string;
  error: string;
};

/*
 * Services
 */

export type OAuthConfig = {
  clientId: string;
  scopes: string[];
};
export interface OAuth2AdapterActions {
  configurationError: (transactionContext?: any) => string;
  isActive: () => boolean;
  getAuthorizationToken: (authorizationCode: string, redirectUrl: string) => Promise<any>;
  getAccountData: (token: any) => Promise<any>;
  isTokenValid: (token: any) => Promise<boolean>;
  refreshToken?: (token: any) => Promise<any>;
}

export type IOAuth2Adapter = IBaseAdapter & {
  provider: string;
  config: OAuthConfig;
  actions: (param: any) => OAuth2AdapterActions;
};

export type IOAuthDirector = IBaseDirector<IOAuth2Adapter> & {
  actions: (params: { provider: string }) => Promise<{
    configurationError: (transactionContext?: any) => string;
    isActive: () => boolean;
    getAuthorizationToken: (authorizationCode: string, redirectUrl: string) => Promise<any>;
    getAccountData: (token: any) => Promise<any>;
    isTokenValid: (token: any) => Promise<boolean>;
    refreshToken?: (refreshToken: any) => Promise<any>;
  }>;
};

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

export interface AccountsOAuth2Module {
  getAuthorizationToken: (
    provider: string,
    authorizationCode: string,
    redirectUrl: string,
  ) => Promise<any>;
  getAccountData: (provider: string, token: any) => Promise<any>;
  isTokenValid: (provider: string, token: any) => Promise<boolean>;
  refreshToken: (provider: string, token: any) => Promise<any>;
  getProviders: () => Promise<Array<IOAuth2Adapter>>;
  getProvider: (provider: string) => Promise<IOAuth2Adapter>;
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
    unchainedAPI: UnchainedCore,
  ) => Promise<{
    id: string;
    token: string;
    tokenExpires: Date;
  }>;
  createImpersonationToken: (
    userId: string,
    unchainedAPI: UnchainedCore,
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
    unchainedAPI: UnchainedCore,
  ) => Promise<{
    id: string;
    token: string;
    tokenExpires: Date;
  }>;
  logout: (
    params: { token?: string; loginToken?: string; userId?: string },
    unchainedAPI: UnchainedCore,
  ) => Promise<{ success: boolean; error?: any }>;
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
    unchainedAPI: UnchainedCore,
  ) => Promise<AccountsUser>;
  sendResetPasswordEmail: (email: string) => Promise<boolean>;

  // TOTP
  buildTOTPSecret: () => string;
  enableTOTP: (userId: string, secret: string, code: string) => Promise<boolean>;
  disableTOTP: (userId: string, code: string) => Promise<boolean>;

  webAuthn: AccountsWebAuthnModule;
  oAuth2: AccountsOAuth2Module;
}
