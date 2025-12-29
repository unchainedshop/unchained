import {
  type TimestampFields,
  type Address,
  type Contact,
  type mongodb,
  buildDbIndexes,
  isDocumentDBCompatModeEnabled,
} from '@unchainedshop/mongodb';
import type { DateFilterInput } from '@unchainedshop/utils';

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
  remotePort?: number;
  userAgent?: string;
}

export interface PushSubscriptionObject {
  userAgent: string;
  endpoint: string;
  expirationTime: number;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export interface Email {
  address: string;
  verified: boolean;
}

export type User = {
  _id: string;
  deleted?: Date | null;
  avatarId?: string;
  emails: Email[];
  guest: boolean;
  initialPassword: boolean;
  lastBillingAddress?: Address;
  lastContact?: Contact;
  lastLogin?: UserLastLogin;
  profile?: UserProfile;
  roles: string[];
  services: any;
  tags?: string[];
  pushSubscriptions: PushSubscriptionObject[];
  username?: string;
  meta?: any;
} & TimestampFields;

export interface UserQuery {
  includeGuests?: boolean;
  includeDeleted?: boolean;
  queryString?: string;
  emailVerified?: boolean;
  lastLogin?: DateFilterInput;
  tags?: string[];
  userIds?: string[];
  username?: string;
  web3Verified?: boolean;
}

export const UsersCollection = async (db: mongodb.Db) => {
  const Users = db.collection<User>('users');

  if (!isDocumentDBCompatModeEnabled()) {
    await buildDbIndexes<User>(Users, [
      {
        index: {
          _id: 'text',
          username: 'text',
          'emails.address': 'text',
          'profile.displayName': 'text',
          'lastBillingAddress.firstName': 'text',
          'lastBillingAddress.lastName': 'text',
          'lastBillingAddress.company': 'text',
          'lastBillingAddress.addressLine': 'text',
          'lastBillingAddress.addressLine2': 'text',
        } as any,
        options: {
          weights: {
            _id: 9,
            'emails.address': 7,
            'profile.displayName': 5,
            'lastBillingAddress.firstName': 3,
            'lastBillingAddress.lastName': 3,
            'lastBillingAddress.company': 1,
            'lastBillingAddress.addressLine': 1,
            'lastBillingAddress.addressLine2': 1,
          },
          name: 'user_fulltext_search',
        },
      },
    ]);
  }

  await buildDbIndexes<User>(Users, [
    {
      index: {
        deleted: 1,
        created: 1,
        guest: 1,
      },
      options: {},
    },
    {
      index: {
        guest: 1,
      },
      options: {
        sparse: true,
      },
    },
    {
      index: {
        created: 1,
      },
      options: {},
    },
    {
      index: {
        username: 1,
      },
      options: {
        unique: true,
        sparse: true,
      },
    },
    {
      index: {
        'emails.address': 1,
      } as any,
      options: {
        unique: true,
        sparse: true,
      },
    },

    {
      index: {
        'services.email.verificationTokens.token': 1,
      } as any,
      options: {
        sparse: true,
      },
    },

    {
      index: {
        'services.password.reset.token': 1,
      } as any,
      options: {
        sparse: true,
      },
    },

    {
      index: {
        'services.token.secret': 1,
      },
      options: {
        sparse: true,
      },
    },
  ]);

  return Users;
};
