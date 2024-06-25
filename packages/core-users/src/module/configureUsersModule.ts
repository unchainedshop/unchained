import localePkg from 'locale';
import { ModuleInput, UnchainedCore } from '@unchainedshop/types/core.js';
import { User, UserQuery, UsersModule } from '@unchainedshop/types/user.js';
import { log, LogLevel } from '@unchainedshop/logger';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, buildSortOptions, mongodb } from '@unchainedshop/mongodb';
import { systemLocale } from '@unchainedshop/utils';
import { FileDirector } from '@unchainedshop/file-upload';
import { SortDirection, SortOption } from '@unchainedshop/types/api.js';
import { v4 as uuidv4 } from 'uuid';
import { UsersCollection } from '../db/UsersCollection.js';
import addMigrations from './addMigrations.js';

const { Locale } = localePkg;

const USER_EVENTS = [
  'USER_UPDATE',
  'USER_UPDATE_PROFILE',
  'USER_ADD_ROLES',
  'USER_UPDATE_ROLE',
  'USER_UPDATE_TAGS',
  'USER_UPDATE_AVATAR',
  'USER_UPDATE_HEARTBEAT',
  'USER_UPDATE_BILLING_ADDRESS',
  'USER_UPDATE_LAST_CONTACT',
  'USER_REMOVE',
];
export const removeConfidentialServiceHashes = (rawUser: User): User => {
  const user = rawUser;
  delete user?.services;
  return user;
};

export const buildFindSelector = ({ includeGuests, queryString, ...rest }: UserQuery) => {
  const selector: mongodb.Filter<User> = { ...rest, deleted: null };
  if (!includeGuests) selector.guest = { $in: [false, null] };
  if (queryString) {
    (selector as any).$text = { $search: queryString };
  }
  return selector;
};

FileDirector.registerFileUploadCallback('user-avatars', async (file, context: UnchainedCore) => {
  const { services } = context;
  return services.users.updateUserAvatarAfterUpload({ file }, context);
});

export const configureUsersModule = async ({
  db,
  migrationRepository,
}: ModuleInput<Record<string, never>>): Promise<UsersModule> => {
  registerEvents(USER_EVENTS);
  const Users = await UsersCollection(db);

  // Migration
  addMigrations(migrationRepository);

  return {
    // Queries
    count: async (query) => {
      const userCount = await Users.countDocuments(buildFindSelector(query));
      return userCount;
    },

    async findUserById(userId) {
      if (!userId) return null;
      return Users.findOne(generateDbFilterById(userId), {});
    },

    async findUserByToken({ resetToken, hashedToken, verifyEmailToken }) {
      if (hashedToken) {
        return Users.findOne({
          'services.resume.loginTokens.hashedToken': hashedToken,
        });
      }

      if (resetToken) {
        return Users.findOne({
          'services.password.reset.token': resetToken,
        });
      }

      if (verifyEmailToken) {
        return Users.findOne({
          'services.email.verificationTokens': {
            $elemMatch: {
              token: verifyEmailToken,
            },
          },
        });
      }

      return null;
    },

    findUser: async (query, options) => {
      const selector = buildFindSelector(query);

      return Users.findOne(selector, options);
    },

    findUsers: async ({ limit, offset, ...query }) => {
      const defaultSort = [{ key: 'created', value: SortDirection.ASC }] as SortOption[];
      const selector = buildFindSelector(query);

      if (query.queryString) {
        return Users.find(selector, {
          skip: offset,
          limit,
          projection: { score: { $meta: 'textScore' } },
          sort: { score: { $meta: 'textScore' } },
        }).toArray();
      }

      return Users.find(selector, {
        skip: offset,
        limit,
        sort: buildSortOptions(query.sort || defaultSort),
      }).toArray();
    },

    userExists: async ({ userId }) => {
      const selector = generateDbFilterById<User>(userId);
      selector.deleted = null; // skip deleted users when checked for existance!
      const userCount = await Users.countDocuments(selector, { limit: 1 });
      return !!userCount;
    },

    // Transformations
    primaryEmail: (user) => {
      return (user.emails || []).sort(
        (left, right) => Number(right.verified) - Number(left.verified),
      )?.[0];
    },

    userLocale: (user) => {
      if (!user?.lastLogin?.locale) return systemLocale;
      return new Locale(user.lastLogin.locale);
    },

    updateAvatar: async (_id, fileId) => {
      const userFilter = generateDbFilterById(_id);
      log('Update Avatar', { userId: _id });

      const modifier = {
        $set: {
          avatarId: fileId,
          updated: new Date(),
        },
      };

      const user = await Users.findOneAndUpdate(userFilter, modifier, {
        returnDocument: 'after',
      });

      await emit('USER_UPDATE_AVATAR', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    updateGuest: async (user, guest) => {
      log('Update guest', { userId: user._id });

      const modifier = { $set: { guest } };
      await Users.updateOne(generateDbFilterById(user._id), modifier);
    },

    updateHeartbeat: async (userId, lastLogin) => {
      const modifier = {
        $set: {
          lastLogin: {
            timestamp: new Date(),
            ...lastLogin,
          },
        },
      };

      const user = await Users.findOneAndUpdate(generateDbFilterById(userId), modifier, {
        returnDocument: 'after',
      });

      await emit('USER_UPDATE_HEARTBEAT', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    updateInitialPassword: async (user, initialPassword) => {
      log(`Update initial password flag to ${initialPassword}`, {
        userId: user._id,
        level: LogLevel.Verbose,
      });

      const modifier = { $set: { initialPassword } };
      await Users.updateOne(generateDbFilterById(user._id), modifier);
    },

    delete: async (userId) => {
      const userFilter = generateDbFilterById(userId);

      const existingUser = await Users.findOne(userFilter, {
        projection: { emails: true, username: true },
      });
      if (!existingUser) return null;

      const obfuscatedEmails = existingUser.emails?.flatMap(({ address, verified }) => {
        if (!verified) return [];
        return [
          {
            address: `${address}@${uuidv4()}.unchained.local`,
            verified: true,
          },
        ];
      });

      const obfuscatedUsername = existingUser.username ? `${existingUser.username}-${uuidv4()}` : null;

      Users.updateOne(userFilter, {
        $set: {
          emails: obfuscatedEmails,
          username: obfuscatedUsername,
          services: {},
        },
      });

      const user = await Users.findOneAndDelete(userFilter);
      await emit('USER_REMOVE', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },
    updateProfile: async (userId, updatedData) => {
      const userFilter = generateDbFilterById(userId);
      const { meta, profile } = updatedData;

      if (!meta && !profile) {
        return Users.findOne(userFilter, {});
      }

      const modifier = { $set: {} };

      if (profile) {
        modifier.$set = Object.keys(profile).reduce((acc, profileKey) => {
          return {
            ...acc,
            [`profile.${profileKey}`]: profile[profileKey],
          };
        }, {});
      }

      if (meta) {
        // eslint-disable-next-line
        // @ts-ignore
        modifier.$set.meta = meta;
      }

      const user = await Users.findOneAndUpdate(userFilter, modifier, {
        returnDocument: 'after',
      });

      await emit('USER_UPDATE_PROFILE', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    updateLastBillingAddress: async (_id, lastBillingAddress) => {
      const userFilter = generateDbFilterById(_id);
      const user = await Users.findOne(userFilter, {});

      const modifier = {
        $set: {
          lastBillingAddress,
          updated: new Date(),
        },
      };
      const profile = user.profile || {};
      const isGuest = !!user.guest;

      if (!profile.displayName || isGuest) {
        modifier.$set['profile.displayName'] = [
          lastBillingAddress.firstName,
          lastBillingAddress.lastName,
        ]
          .filter(Boolean)
          .join(' ');
      }

      const updatedUser = await Users.findOneAndUpdate(generateDbFilterById(_id), modifier, {
        returnDocument: 'after',
      });

      await emit('USER_UPDATE_BILLING_ADDRESS', {
        user: removeConfidentialServiceHashes(user),
      });
      return updatedUser;
    },

    updateLastContact: async (_id, lastContact) => {
      const userFilter = generateDbFilterById(_id);
      const user = await Users.findOne(userFilter, {});
      const profile = user.profile || {};
      const isGuest = !!user.guest;

      const modifier = {
        $set: {
          updated: new Date(),
          lastContact,
        },
      };

      if ((!profile.phoneMobile || isGuest) && lastContact.telNumber) {
        // Backport the contact phone number to the user profile
        modifier.$set['profile.phoneMobile'] = lastContact.telNumber;
      }

      const updatedUser = await Users.findOneAndUpdate(userFilter, modifier, {
        returnDocument: 'after',
      });

      await emit('USER_UPDATE_LAST_CONTACT', {
        user: removeConfidentialServiceHashes(user),
      });
      return updatedUser;
    },

    updateRoles: async (_id, roles) => {
      const modifier = {
        $set: {
          updated: new Date(),
          roles,
        },
      };

      const user = await Users.findOneAndUpdate(generateDbFilterById(_id), modifier, {
        returnDocument: 'after',
      });

      await emit('USER_UPDATE_ROLE', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    updateTags: async (_id, tags) => {
      const modifier = {
        $set: {
          updated: new Date(),
          tags,
        },
      };
      const user = await Users.findOneAndUpdate(generateDbFilterById(_id), modifier, {
        returnDocument: 'after',
      });
      await emit('USER_UPDATE_TAGS', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    updateUser: async (query, modifier, options) => {
      const user = await Users.findOneAndUpdate(query, modifier, {
        ...options,
        returnDocument: 'after',
      });
      await emit('USER_UPDATE', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    addPushSubscription: async (userId, subscription, { userAgent, unsubscribeFromOtherUsers }) => {
      const updateResult = await Users.updateOne(
        { _id: userId, 'pushSubscriptions.keys.p256dh': { $ne: subscription?.keys?.p256dh } },
        {
          $push: {
            pushSubscriptions: {
              userAgent,
              ...subscription,
            },
          },
        },
        {},
      );
      if (updateResult.modifiedCount === 1 && unsubscribeFromOtherUsers) {
        await Users.updateMany(
          { _id: { $ne: userId }, 'pushSubscriptions.keys.p256dh': subscription?.keys?.p256dh },
          {
            $pull: {
              pushSubscriptions: { 'keys.p256dh': subscription?.keys?.p256dh },
            },
          } as mongodb.UpdateFilter<User>,
        );
      }
    },
    removePushSubscription: async (userId, p256dh) => {
      await Users.updateOne(
        { _id: userId },
        {
          $pull: {
            pushSubscriptions: { 'keys.p256dh': p256dh },
          },
        } as mongodb.UpdateFilter<User>,
        {},
      );
    },
  };
};
