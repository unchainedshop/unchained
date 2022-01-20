import { Locale } from 'locale';
import { ModuleInput, ModuleMutations, Query } from '@unchainedshop/types/common';
import { User, UserQuery, UsersModule } from '@unchainedshop/types/user';
import { log } from 'meteor/unchained:logger';
import {
  generateDbFilterById,
  generateDbMutations,
  Schemas,
} from 'meteor/unchained:utils';
import { UsersCollection } from '../db/UsersCollection';
import { systemLocale } from 'meteor/unchained:utils';

const buildFindSelector = ({
  username,
  includeGuests,
  queryString,
}: UserQuery) => {
  const selector: Query = username ? { username } : { username };
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

export const configureUsersModule = async ({
  db,
}: ModuleInput<{}>): Promise<UsersModule> => {
  const Users = await UsersCollection(db);

  const mutations = generateDbMutations<User>(
    Users,
    Schemas.User
  ) as ModuleMutations<User>;

  return {
    // Queries
    count: async (query) => {
      const userCount = await Users.find(buildFindSelector(query)).count();
      return userCount;
    },

    findUser: async ({ userId, resetToken, hashedToken }, options) => {
      if (hashedToken) {
        return await Users.findOne({
          'services.resume.loginTokens.hashedToken': hashedToken,
        }, options);
      }

      if (resetToken) {
        return await Users.findOne({
          'services.password.reset.token': resetToken,
        }, options);
      }

      return await Users.findOne(generateDbFilterById(userId), options);
    },

    findUsers: async ({ limit, offset, includeGuests, queryString }) => {
      const selector = buildFindSelector({ includeGuests, queryString });

      if (queryString) {
        return await Users.find(selector, {
          skip: offset,
          limit,
          projection: { score: { $meta: 'textScore' } },
          sort: { score: { $meta: 'textScore' } },
        }).toArray();
      }

      return await Users.find(selector, { skip: offset, limit }).toArray();
    },

    userExists: async ({ userId }) => {
      const userCount = await Users.find(generateDbFilterById(userId), {
        limit: 1,
      }).count();
      return !!userCount;
    },

    // Transformations
    primaryEmail: (user) => {
      return (user.emails || []).sort(
        ({ verified: verifiedLeft }, { verified: verifiedRight }) =>
          /* @ts-ignore */
          verifiedRight - verifiedLeft
      )?.[0];
    },

    userLocale: (user, params = {}) => {
      return getUserLocale(user, params);
    },

    // Mutations
    addRoles: async (userId, roles) => {
      const updateResult = await Users.updateOne(generateDbFilterById(userId), {
        $addToSet: { roles: { $each: roles } },
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

      return await Users.findOne(userFilter);
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

      return await Users.findOne(userFilter);
    },

    updateInitialPassword: async (user, initialPassword) => {
      log('Update initial password', { userId: user._id });

      const modifier = { $set: { initialPassword } };
      await Users.updateOne(generateDbFilterById(user._id), modifier);
    },

    updateProfile: async (_id, profile, userId) => {
      const userFilter = generateDbFilterById(_id);
      const modifier = {
        $set: Object.keys(profile).reduce((acc, profileKey) => {
          return {
            ...acc,
            [`profile.${profileKey}`]: profile[profileKey],
          };
        }, {}),
      };

      await mutations.update(_id, modifier, userId);

      return await Users.findOne(userFilter);
    },

    updateLastBillingAddress: async (_id, lastBillingAddress, userId) => {
      const userFilter = generateDbFilterById(_id);
      const user = await Users.findOne(userFilter);

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

      return await Users.findOne(userFilter);
    },

    updateLastContact: async (_id, lastContact, userId) => {
      const userFilter = generateDbFilterById(_id);
      const user = await Users.findOne(userFilter);

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

      return await Users.findOne(userFilter);
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

      return await Users.findOne(userFilter);
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

      return await Users.findOne(userFilter);
    },

    updateUser: async (query, modifier, options) => {
      await Users.updateOne(query, modifier, options);
    }
  };
};
