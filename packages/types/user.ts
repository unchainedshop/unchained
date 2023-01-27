import { Filter } from 'mongodb';
import { SortOption } from './api.js';
import {
  Address,
  Contact,
  FindOptions,
  Locale,
  Query,
  TimestampFields,
  Update,
  UpdateOptions,
  _ID,
} from './common.js';
import { UnchainedCore } from './core.js';
import { Country } from './countries.js';
import { File } from './files.js';
import { Language } from './languages.js';

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
  countryContext?: string;
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

type PushSubscriptionObject = {
  userAgent: string;
  endpoint: string;
  expirationTime?: number;
  keys: {
    auth: string;
    p256dh: string;
  };
};

export type User = {
  _id?: _ID;
  deleted?: Date;
  avatarId?: _ID;
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
};

/*
 * Module
 */

export type UsersModule = {
  // Queries
  count: (query: UserQuery) => Promise<number>;
  findUserById: (userId: _ID) => Promise<User>;
  findUserByToken: (query: { resetToken?: string; hashedToken?: string }) => Promise<User>;
  findUser: (selector: UserQuery & { sort?: Array<SortOption> }, options?: FindOptions) => Promise<User>;
  findUsers: (
    query: UserQuery & {
      sort?: Array<SortOption>;
      limit?: number;
      offset?: number;
    },
  ) => Promise<Array<User>>;
  userExists: (query: { userId: string }) => Promise<boolean>;
  pushEnabledByUser: (query: { userId: string }) => Promise<boolean>;

  // Transformations
  primaryEmail: (user: User) => Email;
  userLocale: (user: User) => Locale;

  // Mutations
  addRoles: (userId: string, roles: Array<string>) => Promise<number>;

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
  updateUser: (selector: Query, modifier: Update<User>, options: UpdateOptions) => Promise<void>;
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
