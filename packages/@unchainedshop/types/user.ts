import { Context } from './api';
import {
  Address,
  Contact,
  FindOptions,
  Locale,
  TimestampFields,
  Update,
  _ID,
} from './common';
import { Country } from './countries';
import { File } from './files';
import { Language } from './languages';

export interface UserProfile {
  displayName?: string;
  birthday?: Date;
  phoneMobile?: string;
  gender?: string;
  address?: Address;
  customFields?: unknown;
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

export type User = {
  _id?: _ID;
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
  username?: string;
} & TimestampFields;

type UserQuery = {
  username?: string;
  includeGuests?: boolean;
  queryString?: string;
};

/*
 * Module
 */

export type UsersModule = {
  // Queries
  count: (query: UserQuery) => Promise<number>;
  findUser: (
    query: {
      userId?: _ID;
      resetToken?: string;
      hashedToken?: string;
    },
    options?: FindOptions
  ) => Promise<User>;
  findUsers: (
    query: UserQuery & {
      limit?: number;
      offset?: number;
    }
  ) => Promise<Array<User>>;
  userExists: (query: { userId: string }) => Promise<boolean>;

  // Transformations
  primaryEmail: (user: User) => Email;
  userLocale: (user: User, params?: { localeContext?: Locale }) => Locale;

  // Mutations
  addRoles: (userId: string, roles: Array<string>) => Promise<number>;

  updateAvatar: (_id: string, fileId: string, userId: string) => Promise<User>;
  updateGuest: (user: User, guest: boolean) => Promise<void>;
  updateHeartbeat: (userId: string, doc: UserLastLogin) => Promise<User>;
  updateInitialPassword: (
    user: User,
    initialPassword: boolean
  ) => Promise<void>;
  updateLastBillingAddress: (
    _id: string,
    doc: Address,
    userId: string
  ) => Promise<User>;
  updateLastContact: (
    _id: string,
    doc: Contact,
    userId: string
  ) => Promise<User>;
  updateProfile: (
    _id: string,
    doc: Update<UserProfile>,
    userId: string
  ) => Promise<User>;
  updateRoles: (
    _id: string,
    roles: Array<string>,
    userId: string
  ) => Promise<User>;
  updateTags: (
    _id: string,
    tags: Array<string>,
    userId: string
  ) => Promise<User>;
};

/*
 * Services
 */

export type UpdateUserAvatarAfterUploadService = (
  params: { file: File; userId: string },
  context: Context
) => Promise<void>;

export type GetUserLanguageService = (
  user: User,
  params: { localeContext?: Locale },
  context: Context
) => Promise<Language>;

export type GetUserCountryService = (
  user: User,
  params: { localeContext?: Locale },
  context: Context
) => Promise<Country>;

export interface UserServices {
  getUserCountry: GetUserCountryService;
  getUserLanguage: GetUserLanguageService;
  updateUserAvatarAfterUpload: UpdateUserAvatarAfterUploadService;
}
