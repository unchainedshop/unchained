import { TimestampFields, _ID } from './common';

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

export type User = {
  emails: Array<{ address: string; verified: boolean }>;
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
