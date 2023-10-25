import localePkg from 'locale';
import bcrypt from 'bcryptjs';
import {
  Address,
  Contact,
  Filter,
  FindOptions,
  Query,
  Update,
  UpdateOptions,
} from '@unchainedshop/types/common.js';
import { ModuleInput, ModuleMutations, UnchainedCore } from '@unchainedshop/types/core.js';
import {
  Email,
  User,
  UserData,
  UserLastLogin,
  UserProfile,
  UserQuery,
  UsersSettingsOptions,
} from '@unchainedshop/types/user.js';
import { log, LogLevel } from '@unchainedshop/logger';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbFilterById,
  generateDbMutations,
  Schemas,
  systemLocale,
  buildSortOptions,
} from '@unchainedshop/utils';
import { FileDirector } from '@unchainedshop/file-upload';
import { SortDirection, SortOption } from '@unchainedshop/types/api.js';
import crypto from 'crypto';
import { UsersCollection } from '../db/UsersCollection.js';
import addMigrations from './addMigrations.js';
import { userSettings } from '../users-settings.js';

const { Locale } = localePkg;

const USER_EVENTS = [
  'USER_ACCOUNT_ACTION',
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
  const selector: Query = { ...rest, deleted: null };
  if (!includeGuests) selector.guest = { $in: [false, null] };
  if (queryString) {
    selector.$text = { $search: queryString };
  }
  return selector;
};

FileDirector.registerFileUploadCallback('user-avatars', async (file, context: UnchainedCore) => {
  const { services } = context;

  return services.users.updateUserAvatarAfterUpload({ file }, context);
});

export const configureUsersModule = async ({
  db,
  options,
  migrationRepository,
}: ModuleInput<UsersSettingsOptions>) => {
  userSettings.configureSettings(options || {});

  registerEvents(USER_EVENTS);
  const Users = await UsersCollection(db);

  // Migration
  addMigrations(migrationRepository);

  const mutations = generateDbMutations<User>(Users, Schemas.User) as ModuleMutations<User>;

  return {
    // Queries
    count: async (query: UserQuery): Promise<number> => {
      const userCount = await Users.countDocuments(buildFindSelector(query));
      return userCount;
    },

    async findUserById(userId: string): Promise<User> {
      if (!userId) return null;
      return Users.findOne(generateDbFilterById(userId), {});
    },

    async findUserByUsername(username: string): Promise<User> {
      if (!username) return null;
      return Users.findOne({ username }, {});
    },

    async findUserByEmail(email: string): Promise<User> {
      if (!email) return null;
      return Users.findOne(
        { emails: { $elemMatch: { address: { $regex: email, $options: 'i' } } } },
        {},
      );
    },

    async findUserByToken({
      resetToken,
      hashedToken,
    }: {
      resetToken?: string;
      hashedToken?: string;
    }): Promise<User> {
      if (hashedToken) {
        // TODO: Move to connect-session
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

    findUser: async (
      query: UserQuery & { sort?: Array<SortOption> },
      findOptions?: FindOptions,
    ): Promise<User> => {
      const selector = buildFindSelector(query);

      return Users.findOne(selector, findOptions);
    },

    async findUsers({
      limit,
      offset,
      ...query
    }: UserQuery & {
      sort?: Array<SortOption>;
      limit?: number;
      offset?: number;
    }): Promise<Array<User>> {
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

    async userExists({ userId }: { userId: string }): Promise<boolean> {
      const selector = generateDbFilterById<User>(userId);
      selector.deleted = null; // skip deleted users when checked for existance!
      const userCount = await Users.countDocuments(selector, { limit: 1 });
      return !!userCount;
    },

    // Transformations
    primaryEmail(user: User): Email {
      return (user.emails || []).sort(
        (left, right) => Number(right.verified) - Number(left.verified),
      )?.[0];
    },

    userLocale(user: User): localePkg.Locale {
      if (!user?.lastLogin?.locale) return systemLocale;
      return new Locale(user.lastLogin.locale);
    },

    // Mutations
    async createUser(
      {
        email,
        guest,
        initialPassword,
        lastBillingAddress,
        password,
        // webAuthnPublicKeyCredentials,
        profile,
        roles,
        username,
      }: UserData,
      {
        skipMessaging,
        skipPasswordEnrollment,
      }: { skipMessaging?: boolean; skipPasswordEnrollment?: boolean } = {},
    ): Promise<string> {
      // TODO: Re-Implement, then set service to services and skip password enrollment when webAuthn registration!
      // const webAuthnService =
      //   webAuthnPublicKeyCredentials &&
      //   (await modules.accounts.webAuthn.verifyCredentialCreation(
      //     params.username,
      //     params.webAuthnPublicKeyCredentials,
      //   ));

      const services: Record<string, any> = {};
      if (password) {
        const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(sha256Hash, salt);
        services.password = { bcrypt: hashedPassword };
      }

      const { insertedId: userId } = await Users.insertOne({
        guest,
        services,
        roles: roles || [],
        initialPassword: !!initialPassword,
        emails: email ? [{ address: email, verified: false }] : [],
        pushSubscriptions: [],
        lastBillingAddress,
        profile,
        username,
      });

      const autoMessagingEnabled = skipMessaging
        ? false
        : userSettings.autoMessagingAfterUserCreation && !!email && !!userId;

      if (autoMessagingEnabled) {
        if (password === undefined) {
          if (!skipPasswordEnrollment) {
            await this.sendEnrollmentEmail(userId, email);
          }
        } else {
          await this.sendVerificationEmail(userId, email);
        }
      }
      return userId;
    },

    async sendEnrollmentEmail(userId: string, email: string): Promise<void> {
      const enrollmentToken = {
        token: crypto.randomUUID(),
        address: email,
        when: new Date().getTime() + 1000 * 60 * 60, // 1 hour
      };
      await Users.updateOne(
        { _id: userId },
        {
          $push: {
            'services.email.enrollmentTokens': enrollmentToken,
          },
        },
      );

      await emit('USER_ACCOUNT_ACTION', {
        action: 'enroll-account',
        userId,
        ...enrollmentToken,
      });
    },

    async sendVerificationEmail(userId: string, email: string): Promise<void> {
      const verificationToken = {
        token: crypto.randomUUID(),
        address: email,
        when: new Date().getTime() + 1000 * 60 * 60, // 1 hour
      };
      await Users.updateOne(
        { _id: userId },
        {
          $push: {
            'services.email.verificationTokens': verificationToken,
          },
        },
      );

      await emit('USER_ACCOUNT_ACTION', {
        action: 'verify-email',
        userId,
        ...verificationToken,
      });
    },

    addRoles: async (userId: string, roles: Array<string>): Promise<number> => {
      const selector = generateDbFilterById(userId);
      const updateResult = await Users.updateOne(selector, {
        $addToSet: { roles: { $each: roles } },
      });

      const user = await Users.findOne(selector, {});
      await emit('USER_ADD_ROLES', {
        user: removeConfidentialServiceHashes(user),
      });

      return updateResult.modifiedCount;
    },

    updateAvatar: async (_id: string, fileId: string): Promise<User> => {
      const userFilter = generateDbFilterById(_id);
      log('Update Avatar', { userId: _id });

      const modifier = {
        $set: {
          avatarId: fileId,
          updated: new Date(),
        },
      };

      await mutations.update(_id, modifier);
      const user = await Users.findOne(userFilter, {});
      await emit('USER_UPDATE_AVATAR', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    updateGuest: async (user: User, guest: boolean): Promise<void> => {
      log('Update guest', { userId: user._id });

      const modifier = { $set: { guest } };
      await Users.updateOne(generateDbFilterById(user._id), modifier);
    },

    updateHeartbeat: async (userId: string, lastLogin: UserLastLogin): Promise<User> => {
      const userFilter = generateDbFilterById(userId);

      const modifier = {
        $set: {
          lastLogin: {
            timestamp: new Date(),
            ...lastLogin,
          },
        },
      };

      await mutations.update(userId, modifier);
      const user = await Users.findOne(userFilter, {});

      await emit('USER_UPDATE_HEARTBEAT', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    updateInitialPassword: async (user: User, initialPassword: boolean): Promise<void> => {
      log(`Update initial password flag to ${initialPassword}`, {
        userId: user._id,
        level: LogLevel.Verbose,
      });

      const modifier = { $set: { initialPassword } };
      await Users.updateOne(generateDbFilterById(user._id), modifier);
    },

    delete: async (userId: string): Promise<User> => {
      const userFilter = generateDbFilterById(userId);

      const existingUser = await Users.findOne(userFilter, {
        projection: { emails: true, username: true },
      });
      if (!existingUser) return null;

      const uuid = crypto.randomUUID();
      const obfuscatedEmails = existingUser.emails?.flatMap(({ address, verified }) => {
        if (!verified) return [];
        return [
          {
            address: `${address}@${uuid}.unchained.local`,
            verified: true,
          },
        ];
      });

      const obfuscatedUsername = existingUser.username ? `${existingUser.username}-${uuid}` : null;

      Users.updateOne(userFilter, {
        $set: {
          emails: obfuscatedEmails,
          username: obfuscatedUsername,
          services: {},
        },
      });

      await mutations.delete(userId);
      const user = await Users.findOne(userFilter, {});
      await emit('USER_REMOVE', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    updateProfile: async (
      userId: string,
      updatedData: { profile?: UserProfile; meta?: any },
    ): Promise<User> => {
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

      await mutations.update(userId, modifier);
      const user = await Users.findOne(userFilter, {});
      await emit('USER_UPDATE_PROFILE', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    updateLastBillingAddress: async (_id: string, lastBillingAddress: Address): Promise<User> => {
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

      await mutations.update(_id, modifier);
      const updatedUser = await Users.findOne(userFilter, {});
      await emit('USER_UPDATE_BILLING_ADDRESS', {
        user: removeConfidentialServiceHashes(user),
      });
      return updatedUser;
    },

    updateLastContact: async (_id: string, lastContact: Contact): Promise<User> => {
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

      await mutations.update(_id, modifier);
      const updatedUser = await Users.findOne(userFilter, {});
      await emit('USER_UPDATE_LAST_CONTACT', {
        user: removeConfidentialServiceHashes(user),
      });
      return updatedUser;
    },

    updateRoles: async (_id: string, roles: Array<string>): Promise<User> => {
      const userFilter = generateDbFilterById(_id);

      const modifier = {
        $set: {
          updated: new Date(),
          roles,
        },
      };
      await mutations.update(_id, modifier);
      const user = await Users.findOne(userFilter, {});
      await emit('USER_UPDATE_ROLE', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    updateTags: async (_id: string, tags: Array<string>): Promise<User> => {
      const userFilter = generateDbFilterById(_id);

      const modifier = {
        $set: {
          updated: new Date(),
          tags,
        },
      };

      await mutations.update(_id, modifier);
      const user = await Users.findOne(userFilter, {});
      await emit('USER_UPDATE_TAGS', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    updateUser: async (
      selector: Query,
      modifier: Update<User>,
      updateOptions: UpdateOptions,
    ): Promise<void> => {
      await Users.updateOne(selector, modifier, updateOptions);
      const user = await Users.findOne(selector);
      await emit('USER_UPDATE', {
        user: removeConfidentialServiceHashes(user),
      });
    },

    addPushSubscription: async (
      userId: string,
      subscription: any,
      subscriptionOptions?: {
        userAgent: string;
        unsubscribeFromOtherUsers: boolean;
      },
    ): Promise<void> => {
      const updateResult = await Users.updateOne(
        { _id: userId, 'pushSubscriptions.keys.p256dh': { $ne: subscription?.keys?.p256dh } },
        {
          $push: {
            pushSubscriptions: {
              userAgent: subscriptionOptions?.userAgent,
              ...subscription,
            },
          },
        },
        {},
      );
      if (updateResult.modifiedCount === 1 && subscriptionOptions?.unsubscribeFromOtherUsers) {
        await Users.updateMany(
          { _id: { $ne: userId }, 'pushSubscriptions.keys.p256dh': subscription?.keys?.p256dh },
          {
            $pull: {
              pushSubscriptions: { 'keys.p256dh': subscription?.keys?.p256dh },
            },
          } as Filter<User>,
        );
      }
    },

    removePushSubscription: async (userId: string, p256dh: string): Promise<void> => {
      await Users.updateOne(
        { _id: userId },
        {
          $pull: {
            pushSubscriptions: { 'keys.p256dh': p256dh },
          },
        } as Filter<User>,
        {},
      );
    },
  };
};
