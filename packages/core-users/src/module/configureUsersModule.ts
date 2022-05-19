import { Locale } from 'locale';
import { ModuleInput, ModuleMutations, Query } from '@unchainedshop/types/common';
import { User, UserQuery, UsersModule } from '@unchainedshop/types/user';
import { log } from 'meteor/unchained:logger';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  generateDbFilterById,
  generateDbMutations,
  Schemas,
  systemLocale,
} from 'meteor/unchained:utils';
import { FileDirector } from 'meteor/unchained:file-upload';
import { Context } from '@unchainedshop/types/api';
import { UsersCollection } from '../db/UsersCollection';

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
];
const removeConfidentialServiceHashes = (rawUser: User): User => {
  const user = rawUser;
  delete user?.services;
  return user;
};

const buildFindSelector = ({ includeGuests, queryString, ...rest }: UserQuery) => {
  const selector: Query = { ...rest };
  if (!includeGuests) selector.guest = { $ne: true };
  if (queryString) {
    selector.$text = { $search: queryString };
  }
  return selector;
};

const getUserLocale = (user: User, params: { localeContext?: Locale } = {}) => {
  const locale =
    params.localeContext ||
    (user.lastLogin?.locale && new Locale(user.lastLogin.locale)) ||
    systemLocale;
  return locale;
};

FileDirector.registerFileUploadCallback('user-avatars', async (file, context: Context) => {
  const { services } = context;

  return services.users.updateUserAvatarAfterUpload({ file }, context);
});

export const configureUsersModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<UsersModule> => {
  registerEvents(USER_EVENTS);
  const Users = await UsersCollection(db);

  const mutations = generateDbMutations<User>(Users, Schemas.User) as ModuleMutations<User>;

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

    async findUserByToken({ resetToken, hashedToken }) {
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

      return null;
    },

    findUser: async (query, options) => {
      const selector = buildFindSelector(query);

      return Users.findOne(selector, options);
    },

    findUsers: async ({ limit, offset, ...query }) => {
      const selector = buildFindSelector(query);

      if (query.queryString) {
        return Users.find(selector, {
          skip: offset,
          limit,
          projection: { score: { $meta: 'textScore' } },
          sort: { score: { $meta: 'textScore' } },
        }).toArray();
      }

      return Users.find(selector, { skip: offset, limit }).toArray();
    },

    userExists: async ({ userId }) => {
      const selector = generateDbFilterById(userId);
      const userCount = await Users.countDocuments(selector, { limit: 1 });
      return !!userCount;
    },

    // Transformations
    primaryEmail: (user) => {
      return (user.emails || []).sort(
        (left, right) => Number(right.verified) - Number(left.verified),
      )?.[0];
    },

    userLocale: (user, params = {}) => {
      return getUserLocale(user, params);
    },

    // Mutations
    addRoles: async (userId, roles) => {
      const selector = generateDbFilterById(userId);
      const updateResult = await Users.updateOne(selector, {
        $addToSet: { roles: { $each: roles } },
      });

      const user = await Users.findOne(selector, {});
      emit('USER_ADD_ROLES', {
        user: removeConfidentialServiceHashes(user),
      });

      return updateResult.modifiedCount;
    },

    updateAvatar: async (_id, fileId, userId) => {
      const userFilter = generateDbFilterById(_id);
      log('Update Avatar', { userId: _id });

      const modifier = {
        $set: {
          avatarId: fileId,
          updated: new Date(),
          updatedBy: userId,
        },
      };

      await mutations.update(_id, modifier, userId);
      const user = await Users.findOne(userFilter, {});
      emit('USER_UPDATE_AVATAR', {
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
      const userFilter = generateDbFilterById(userId);

      const modifier = {
        $set: {
          lastLogin: {
            timestamp: new Date(),
            ...lastLogin,
          },
        },
      };

      await mutations.update(userId, modifier, userId);
      const user = await Users.findOne(userFilter, {});

      emit('USER_UPDATE_HEARTBEAT', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    updateInitialPassword: async (user, initialPassword) => {
      log(`Update initial password flag to ${initialPassword}`, { userId: user._id, level: 'verbose' });

      const modifier = { $set: { initialPassword } };
      await Users.updateOne(generateDbFilterById(user._id), modifier);
    },

    updateProfile: async (_id, updatedData, userId) => {
      const userFilter = generateDbFilterById(_id);
      const { meta, profile } = updatedData;

      const modifier = {
        $set: Object.keys(profile).reduce((acc, profileKey) => {
          return {
            ...acc,
            [`profile.${profileKey}`]: profile[profileKey],
          };
        }, {}),
      };

      if (meta)
        modifier.$set = {
          ...modifier.$set,
          meta,
        };
      await mutations.update(_id, modifier, userId);
      const user = await Users.findOne(userFilter, {});
      emit('USER_UPDATE_PROFILE', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    updateLastBillingAddress: async (_id, lastBillingAddress, userId) => {
      const userFilter = generateDbFilterById(_id);
      const user = await Users.findOne(userFilter, {});

      log('Store Last Billing Address', { userId });

      const modifier = {
        $set: {
          lastBillingAddress,
          updated: new Date(),
          updatedBy: userId,
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

      await mutations.update(_id, modifier, userId);
      const updatedUser = await Users.findOne(userFilter, {});
      emit('USER_UPDATE_BILLING_ADDRESS', {
        user: removeConfidentialServiceHashes(user),
      });
      return updatedUser;
    },

    updateLastContact: async (_id, lastContact, userId) => {
      const userFilter = generateDbFilterById(_id);
      const user = await Users.findOne(userFilter, {});

      log('Store Last Contact', { userId });

      const profile = user.profile || {};
      const isGuest = !!user.guest;

      const modifier = {
        $set: {
          updated: new Date(),
          updatedBy: userId,
          lastContact,
        },
      };

      if ((!profile.phoneMobile || isGuest) && lastContact.telNumber) {
        // Backport the contact phone number to the user profile
        modifier.$set['profile.phoneMobile'] = lastContact.telNumber;
      }

      await mutations.update(_id, modifier, userId);
      const updatedUser = await Users.findOne(userFilter, {});
      emit('USER_UPDATE_LAST_CONTACT', {
        user: removeConfidentialServiceHashes(user),
      });
      return updatedUser;
    },

    updateRoles: async (_id, roles, userId) => {
      const userFilter = generateDbFilterById(_id);

      const modifier = {
        $set: {
          updated: new Date(),
          updateBy: userId,
          roles,
        },
      };
      await mutations.update(_id, modifier, userId);
      const user = await Users.findOne(userFilter, {});
      emit('USER_UPDATE_ROLE', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },
    updateTags: async (_id, tags, userId) => {
      const userFilter = generateDbFilterById(_id);

      const modifier = {
        $set: {
          updated: new Date(),
          updateBy: userId,
          tags,
        },
      };

      await mutations.update(_id, modifier, userId);
      const user = await Users.findOne(userFilter, {});
      emit('USER_UPDATE_TAGS', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    updateUser: async (query, modifier, options) => {
      await Users.updateOne(query, modifier, options);
      const user = await Users.findOne(query);
      emit('USER_UPDATE', {
        user: removeConfidentialServiceHashes(user),
      });
    },
  };
};
