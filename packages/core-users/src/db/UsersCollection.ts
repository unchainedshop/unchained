import { Db } from '@unchainedshop/types/common';
import { User } from '@unchainedshop/types/user';
import { buildDbIndexes } from 'meteor/unchained:utils';

export const UsersCollection = async (db: Db) => {
  const Users = db.collection<User>('users');

  await buildDbIndexes<User>(Users, [
    () =>
      Users.createIndex(
        {
          username: 1,
        },
        {
          unique: true,
          sparse: true,
        }
      ),
    () =>
      Users.createIndex(
        {
          'emails.address': 1,
        },
        {
          unique: true,
          sparse: true,
        }
      ),

    () =>
      Users.createIndex(
        {
          'services.email.verificationTokens.token': 1,
        },
        {
          sparse: true,
        }
      ),

    () =>
      Users.createIndex(
        {
          'services.password.reset.token': 1,
        },
        {
          sparse: true,
        }
      ),

    () =>
      Users.createIndex(
        {
          'services.resume.loginTokens.hashedToken': 1,
        },
        {
          sparse: true,
        }
      ),

    () =>
      Users.createIndex(
        {
          _id: 'text',
          username: 'text',
          'emails.address': 'text',
          'profile.displayName': 'text',
          'lastBillingAddress.firstName': 'text',
          'lastBillingAddress.lastName': 'text',
          'lastBillingAddress.company': 'text',
          'lastBillingAddress.addressLine': 'text',
          'lastBillingAddress.addressLine2': 'text',
        },
        {
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
        }
      ),
  ]);

  return Users;
};
