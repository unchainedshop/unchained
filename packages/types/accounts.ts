import { UnchainedCore } from './core.js';

export interface WebAuthnCredentialsCreationRequest {
  challenge: string;
  username: string;
  origin: string;
  factor: 'first' | 'second' | 'either';
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
 * Settings
 */

export interface AccountsSettingsOptions {
  mergeUserCartsOnLogin?: boolean;
  server?: any;
  password?: any;
}
export interface AccountsSettings {
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

  // Authentication
  createLoginToken: (
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
  webAuthn: AccountsWebAuthnModule;
}
