import type { Filter, FindOptions, UpdateFilter, FindOneAndUpdateOptions } from 'mongodb';
import { SortOption } from './api.js';
import { Address, Contact, DateFilterInput, Locale, TimestampFields } from './common.js';
import { UnchainedCore } from './core.js';
import { Country } from './countries.js';
import { File } from './files.js';
import { Language } from './languages.js';

export enum UserOrderFilter {
  HAS_ORDERS = 'HAS_ORDERS',
  NO_ORDERS = 'NO_ORDERS',
}

export enum UserVerificationFilter {
  VERIFIED = 'VERIFIED',
  UNVERIFIED = 'UNVERIFIED',
}

export enum UserCartFilter {
  HAS_CART = 'HAS_CART',
  NO_CART = 'NO_CART',
}

export interface PushSubscription {
  _id: string;
  userAgent: string;
  expirationTime: number;
  endpoint: string;
}

export interface UserProfile {
  displayName?: string;
  birthday?: Date;
  phoneMobile?: string;
  gender?: string;
  address?: Address;
}

export interface UserLastLogin {
  timestamp?: Date;
  locale?: string;
  countryCode?: string;
  remoteAddress?: string;
  remotePort?: string;
  userAgent?: string;
}

export interface Email {
  address: string;
  verified: boolean;
}

export interface WebAuthnCredentials {
  id: string;
  publicKey: string;
  created: Date;
  aaguid: string;
  counter: number;
  mdsMetadata: any;
}

export interface Web3Address {
  address: string;
  nonce?: number;
  verified: boolean;
}

export interface OAuthAccount {
  id: string;
  provider: string;
  authorizationCode: string;
}
export interface PushSubscriptionObject {
  userAgent: string;
  endpoint: string;
  expirationTime?: number;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export type User = {
  _id?: string;
  deleted?: Date;
  avatarId?: string;
  emails: Array<Email>;
  guest: boolean;
  initialPassword: boolean;
  lastBillingAddress?: Address;
  lastContact?: Contact;
  lastLogin?: UserLastLogin;
  profile?: UserProfile;
  roles: Array<string>;
  services: any;
  tags?: Array<string>;
  pushSubscriptions: Array<PushSubscriptionObject>;
  username?: string;
  meta?: any;
} & TimestampFields;

export type UserQuery = Filter<User> & {
  includeGuests?: boolean;
  queryString?: string;
  verificationStatus?: UserVerificationFilter;
  loginWithinDays?: DateFilterInput;
};

/*
 * Module
 */

export type UsersModule = {
  // Queries
  count: (query: UserQuery) => Promise<number>;
  findUserById: (userId: string) => Promise<User>;
  findUserByToken: (query: {
    resetToken?: string;
    hashedToken?: string;
    verifyEmailToken?: string;
  }) => Promise<User>;
  findUser: (selector: UserQuery & { sort?: Array<SortOption> }, options?: FindOptions) => Promise<User>;
  findUsers: (
    query: UserQuery & {
      sort?: Array<SortOption>;
      limit?: number;
      offset?: number;
    },
  ) => Promise<Array<User>>;
  userExists: (query: { userId: string }) => Promise<boolean>;
  // Transformations
  primaryEmail: (user: User) => Email;
  userLocale: (user: User) => Locale;

  updateAvatar: (_id: string, fileId: string) => Promise<User>;
  updateGuest: (user: User, guest: boolean) => Promise<void>;
  updateHeartbeat: (userId: string, doc: UserLastLogin) => Promise<User>;
  updateInitialPassword: (user: User, initialPassword: boolean) => Promise<void>;
  updateLastBillingAddress: (_id: string, lastAddress: Address) => Promise<User>;
  updateLastContact: (_id: string, lastContact: Contact) => Promise<User>;
  updateProfile: (
    _id: string,
    { profile, meta }: { profile?: UserProfile; meta?: any },
  ) => Promise<User>;
  delete: (userId: string) => Promise<User>;
  updateRoles: (_id: string, roles: Array<string>) => Promise<User>;
  updateTags: (_id: string, tags: Array<string>) => Promise<User>;
  updateUser: (
    selector: Filter<User>,
    modifier: UpdateFilter<User>,
    options: FindOneAndUpdateOptions,
  ) => Promise<User>;
  addPushSubscription: (
    userId: string,
    subscription: any,
    options?: {
      userAgent: string;
      unsubscribeFromOtherUsers: boolean;
    },
  ) => Promise<void>;
  removePushSubscription: (userId: string, p256dh: string) => Promise<void>;
};

/*
 * Services
 */

export type UpdateUserAvatarAfterUploadService = (
  params: { file: File },
  context: UnchainedCore,
) => Promise<void>;

export type GetUserLanguageService = (user: User, context: UnchainedCore) => Promise<Language>;

export type GetUserCountryService = (user: User, context: UnchainedCore) => Promise<Country>;

export interface UserServices {
  getUserCountry: GetUserCountryService;
  getUserLanguage: GetUserLanguageService;
  updateUserAvatarAfterUpload: UpdateUserAvatarAfterUploadService;
}
