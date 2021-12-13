import { Locale } from 'locale';
import { Context } from './api';
import { Address, Contact, TimestampFields, Update, _ID } from './common';
import { Language } from './languages';
import { UpdateFilter } from './node_modules/mongodb';
import { Country } from './countries';
import { File } from './files';
import { PaymentCredentials } from './payments';

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

interface Email {
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
  includeGuests?: boolean;
  queryString?: string;
};

export type UsersModule = {
  // Queries
  count: (query: UserQuery) => Promise<number>;
  findUser: (query: {
    userId?: _ID;
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
    _id: sting,
    doc: UpdateFilter<UserProfile>,
    userId: string
  ) => Promise<User>;
  updateAvatar: (_id: string, fileId: string, userId: string) => Promise<User>;
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
  updateHeartbeat: (userId: string, doc: UserLastLogin) => Promise<User>;
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

type HelperType<P, T> = (user: User, params: P, context: Context) => T;

export interface UserHelperTypes {
  _id: HelperType<any, boolean>;
  avatar: HelperType<{ localeContext: Locale }, Promise<File>>;
  bookmarks: HelperType<any, Promise<Array<Bookmark>>>;
  cart: HelperType<any, any>;
  country: HelperType<{ localeContext: Locale }, Promise<Country>>;
  email: HelperType<any, string>;
  emails: HelperType<any, Array<string>>;
  enrollments: HelperType<any, any>;
  isEmailVerified: HelperType<any, boolean>;
  isGuest: HelperType<any, boolean>;
  isInitialPassword: HelperType<any, boolean>;
  isTwoFactorEnabled: HelperType<any, boolean>;
  language: HelperType<{ localeContext: Locale }, Promise<Language>>;
  lastBillingAddress: HelperType<any, Address>;
  lastContact: HelperType<any, Contact>;
  lastLogin: HelperType<any, UserLastLogin>;
  locale: HelperType<{ localeContext: Locale }, Locale>;
  name: HelperType<any, string>;
  orders: HelperType<any, any>;
  paymentCredentials: HelperType<any, Promise<Array<PaymentCredentials>>>;
  primaryEmail: HelperType<any, Email>;
  profile: HelperType<any, UserProfile>;
  quotations: HelperType<any, any>;
  roles: HelperType<any, Array<string>>;
  tags: HelperType<any, Array<string>>;
  telNumber: HelperType<any, string>;
  username: HelperType<any, string>;
}
