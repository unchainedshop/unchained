import type { TimestampFields, Address, Contact, mongodb } from '@unchainedshop/mongodb';

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

export type UserQuery = mongodb.Filter<User> & {
  includeGuests?: boolean;
  queryString?: string;
};

export interface WebAuthnCredentialsCreationRequest {
  challenge: string;
  username: string;
  origin: string;
  factor: 'first' | 'second' | 'either';
}

/*
 * Module
 */
export interface UserData {
  email?: string;
  guest?: boolean;
  initialPassword?: boolean;
  lastBillingAddress?: User['lastBillingAddress'];
  password: string | null;
  webAuthnPublicKeyCredentials?: any;
  profile?: UserProfile;
  roles?: Array<string>;
  username?: string;
}
