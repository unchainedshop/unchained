import { User as AccountsUser } from '@accounts/types';
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
  token_type: string;
  id_token: string;
  error: string;
};

export type UserOauthData = {
  email: string;
  lastName: string;
  avatarUrl: string;
  firstName: string;
  address?: string;
  gender?: string;
  birthDate?: Date;
  phoneNumber?: string;
  displayName?: string;
  city?: string;
  countryCode?: string;
  postalCode?: string;
  regionCode?: string;
  company?: string;
};

/*
 * Services
 */

export interface Oauth2AdapterActions {
  configurationError: (transactionContext?: any) => string;
  isActive: () => boolean;
  getAuthorizationCode: (authorizationCode: string, redirectUrl: string) => Promise<any>;
  getAccountData: (token: string) => Promise<UserOauthData>;
  isTokenValid: (token) => Promise<boolean>;
  refreshToken?: (refreshToken: string) => Promise<any>;
}
export type OauthConfig = {
  clientId: string;
  scopes: string[];
};
export type IOauth2Adapter = IBaseAdapter & {
  provider: string;
  config: OauthConfig;
  actions: (param: any, unchainedAPI: UnchainedCore) => Oauth2AdapterActions;
};

export type IOauthDirector = IBaseDirector<IOauth2Adapter> & {
  actions: (
    params: { provider: string },
    unchainedAPI: UnchainedCore,
  ) => Promise<{
    configurationError: (transactionContext?: any) => string;
    isActive: () => boolean;
    getAuthorizationCode: (authorizationCode: string, redirectUrl: string) => Promise<any>;
    getAccountData: (token: string) => Promise<UserOauthData>;
    isTokenValid: (token) => Promise<boolean>;
    refreshToken?: (refreshToken: string) => Promise<any>;
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

export interface Oauth2Service {
  getAuthorizationCode: (authorizationCode: string, redirectUrl: string) => Promise<any>;
  getAccountData: (token: string) => Promise<UserOauthData>;
  isTokenValid: (token) => Promise<boolean>;
  refreshToken?: (refreshToken: string) => Promise<any>;
  unLinkOauthProvider: (userId: string, authorizationCode: string) => Promise<User>;
  linkOauthProvider: (
    userId: string,
    {
      data,
      authorizationToken,
      authorizationCode,
    }: { data: UserOauthData; authorizationToken: string; authorizationCode: string },
  ) => Promise<User>;
}

export interface AccountsServices {
  oauth2: (params: { provider: string }, unchainedApi: UnchainedCore) => Promise<Oauth2Service>;
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
}
