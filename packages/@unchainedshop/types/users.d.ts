import { Locale } from 'locale';
import { Context } from './api';
import { TimestampFields, _ID } from './common';
import { Language } from './languages';

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

interface UserProfile {
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
  emails: Array<Email>;
  username?: string;
  lastLogin?: UserLastLogin;
  profile?: UserProfile;
  lastBillingAddress?: Address;
  lastContact?: UserLastContact;
  guest: boolean;
  initialPassword: boolean;
  tags?: Array<string>;
  avatarId?: string;
  services: unknown;
  roles: Array<string>;
} & TimestampFields;

type UserQuery = {
  includeGuests?: boolean;
  queryString?: string;
};

export type UsersModule = ModuleMutations<User> & {
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
  createUser: (
    doc: User,
    userId: string,
    context: any,
    options: { skipMessaging?: boolean }
  ) => Promise<User>;

  createLogintoken: (
    user: User,
    context: Context
  ) => Promise<{
    id: string;
    token: string;
    tokenExpires: string;
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
    tokenExpires: string;
    user?: User;
  }>;

  updateProfile: (
    _id: string,
    doc: UpdateFilter<UserProfile>,
    userId: string
  ) => Promise<string>;
  updateLastBillingAddress: (
    _id: string,
    doc: UpdateFilter<Address>,
    userId: string
  ) => Promise<string>;
  updateLastContact: (
    _id: string,
    doc: UpdateFilter<UserLastContact>,
    userId: string
  ) => Promise<string>;
  updateHeartbeat: (
    _id: string,
    doc: UserLastLogin,
    userId: string
  ) => Promise<string>;

  addEmail: (params: {
    userId: string;
    email: string;
    verified?: boolean;
  }) => Promise<User>;
  removeEmail: (params: { userId: string; email: string }) => Promise<User>;
  updateEmail: (params: {
    userId: string;
    email: string;
    verified?: boolean;
  }) => Promise<User>;

  setPassword: (params: { userId: string; password: string }) => Promise<User>;
  setUsername: (params: { userId: string; username: string }) => Promise<User>;
  setTags: (params: { userId: string; tags: Array<string> }) => Promise<User>;
  setRoles: (params: { userId: string; roles: Array<string> }) => Promise<User>;
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

  createSignedUploadURL: (fileName: string) => Promise<File>
}
