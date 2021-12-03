import { Locale } from 'locale';
import { Context } from './api';
import { TimestampFields, Update, _ID } from './common';
import { Language } from './languages';
import { UpdateFilter } from './node_modules/mongodb';
import { Country } from './countries';

interface Address {
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  regionCode?: string;
  countryCode?: string;
}

export interface UserProfile {
  displayName?: string;
  birthday?: Date;
  phoneMobile?: string;
  gender?: string;
  address?: Address;
  customFields?: unknown;
}

interface UserLastLogin {
  timestamp?: Date;
  locale?: string;
  countryContext?: string;
  remoteAddress?: string;
  remotePort?: string;
  userAgent?: string;
}

interface UserLastContact {
  telNumber?: string;
  emailAddress?: string;
}

interface Email {
  address: string;
  verified: boolean;
}

export type User = {
  _id?: _ID;
  avatarId?: string;
  emails: Array<Email>;
  guest: boolean;
  initialPassword: boolean;
  lastBillingAddress?: Address;
  lastContact?: UserLastContact;
  lastLogin?: UserLastLogin;
  profile?: UserProfile;
  roles: Array<string>;
  services: unknown;
  tags?: Array<string>;
  username?: string;
} & TimestampFields;

type UserQuery = {
  includeGuests?: boolean;
  queryString?: string;
};

export type UsersModule = {
  // Queries
  count: (query: UserQuery) => Promise<number>;
  findUser: (query: {
    userId?: string;
    resetToken?: string;
    hashedToken?: string;
  }) => Promise<User>;
  findUsers: (
    query: UserQuery & {
      limit?: number;
      offset?: number;
    }
  ) => Promise<Array<User>>;
  userExists: (query: { userId: string }) => Promise<boolean>;

  // Mutations
  updateProfile: (
    _id: string,
    doc: UpdateFilter<UserProfile>,
    userId: string
  ) => Promise<User>;
  updateLastBillingAddress: (
    _id: string,
    doc: Address,
    userId: string
  ) => Promise<User>;
  updateLastContact: (
    _id: string,
    doc: UserLastContact,
    userId: string
  ) => Promise<User>;
  updateHeartbeat: (
    _id: string,
    doc: UserLastLogin,
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

export interface UserHelperTypes {
  isGuest: (user: User) => boolean;
  isTwoFactorEnabled: (user: User) => boolean;
  isInitialPassword: (user: User) => boolean;
  isEmailVerified: (user: User) => boolean;
  language: (
    user: User,
    params: { localeContext: Locale },
    context: Context
  ) => Language;
  country: (
    user: User,
    params: { localeContext: Locale },
    context: Context
  ) => Country;
  locale: (
    user: User,
    params: { localeContext: Locale },
    context: Context
  ) => Locale;
  avatar: (
    user: User,
    params: { localeContext: Locale },
    context: Context
  ) => File;
  primaryEmail: (user: User) => Email;
  email: (user: User) => string;
  telNumber: (user: User) => string;
  name: (user: User) => string;

  createSignedUploadURL: (fileName: string) => Promise<File>;
}
