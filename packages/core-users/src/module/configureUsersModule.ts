import { ModuleInput } from '@unchainedshop/types/common';
import { User, UsersModule } from '@unchainedshop/types/user';
import { log } from 'meteor/unchained:logger';
import {
  generateDbFilterById,
  generateDbMutations,
} from 'meteor/unchained:utils';
import { UsersCollection } from '../db/UsersCollection';
import { UsersSchema } from '../db/UsersSchema';

type FindQuery = {
  includeGuests?: boolean;
  queryString?: string;
};

const buildFindSelector = ({ includeGuests, queryString }: FindQuery) => {
  const selector: any = {};
  if (!includeGuests) selector.guest = { $ne: true };
  if (queryString) {
    selector.$text = { $search: queryString };
  }
  return selector;
};

export const configureUsersModule = async ({
  db,
}: ModuleInput): Promise<UsersModule> => {
  const Users = await UsersCollection(db);

  const mutations = generateDbMutations<User>(Users, UsersSchema);

  return {
    // Queries
    count: async (query) => {
      const userCount = await Users.find(buildFindSelector(query)).count();
      return userCount;
    },

    findUser: async ({ userId, resetToken, hashedToken }) => {
      if (hashedToken) {
        return await Users.findOne({
          'services.resume.loginTokens.hashedToken': hashedToken,
        });
      }

      if (resetToken) {
        return await Users.findOne({
          'services.password.reset.token': resetToken,
        });
      }
      return await Users.findOne(generateDbFilterById(userId));
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

    // Mutations
    updateProfile: async (_id, profile, userId) => {
      const userFilter = generateDbFilterById(_id);
      const modifier = Object.keys(profile).reduce((acc, profileKey) => {
        return {
          ...acc,
          [`profile.${profileKey}`]: profile[profileKey],
        };
      }, {});

      await Users.updateOne(userFilter, {
        $set: {
          updated: new Date(),
          updatedBy: userId,
          ...modifier,
        },
      });

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

      await Users.updateOne(userFilter, modifier);

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

      await Users.updateOne(userFilter, modifier);

      return await Users.findOne(userFilter);
    },

    updateHeartbeat: async (_id, lastLogin, userId) => {
      const userFilter = generateDbFilterById(_id);

      await Users.updateOne(userFilter, {
        $set: {
          lastLogin: {
            timestamp: new Date(),
            ...lastLogin,
          },
        },
      });

      return await Users.findOne(userFilter);
    },

    updateRoles: async (_id, roles, userId) => {
      const userFilter = generateDbFilterById(_id);

      await Users.updateOne(userFilter, {
        $set: {
          updated: new Date(),
          updateBy: userId,
          roles,
        },
      });
      return await Users.findOne(userFilter);
    },
    updateTags: async (_id, tags, userId) => {
      const userFilter = generateDbFilterById(_id);

      await Users.updateOne(userFilter, {
        $set: {
          updated: new Date(),
          updateBy: userId,
          tags,
        },
      });
      return await Users.findOne(userFilter);
    },
  };
};
