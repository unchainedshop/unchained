import { Locale } from 'locale';
import { UpdateFilter } from 'mongodb';
import { Address, Contact, TimestampFields, _ID } from './common';

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

  // Transformations
  primaryEmail: (user: User) => Email;
  userLocale: (user: User, params?: { localeContext?: Locale }) => Locale;

  // Mutations
  updateProfile: (
    _id: string,
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
