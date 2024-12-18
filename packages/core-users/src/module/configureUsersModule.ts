import * as bcrypt from '@node-rs/bcrypt';
import {
  ModuleInput,
  Address,
  Contact,
  generateDbFilterById,
  buildSortOptions,
  mongodb,
  generateDbObjectId,
} from '@unchainedshop/mongodb';
import {
  User,
  UserQuery,
  Email,
  UserLastLogin,
  UserProfile,
  UsersCollection,
} from '../db/UsersCollection.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { systemLocale, SortDirection, SortOption, sha256 } from '@unchainedshop/utils';
import addMigrations from './addMigrations.js';
import { userSettings, UserSettingsOptions } from '../users-settings.js';
import { configureUsersWebAuthnModule, UsersWebAuthnModule } from './configureUsersWebAuthnModule.js';
import * as pbkdf2 from './pbkdf2.js';

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

export type UsersModule = {
  // Submodules
  webAuthn: UsersWebAuthnModule;

  // Queries
  count: (query: UserQuery) => Promise<number>;
  findUserById: (userId: string) => Promise<User>;
  findUserByToken: (hashedToken?: string) => Promise<User>;
  findUserByResetToken: (token: string) => Promise<User>;
  findUnverifiedEmailToken: (token: string) => Promise<{
    userId: string;
    address: string;
    when: Date;
  }>;
  findUserByEmail(email: string): Promise<User>;
  findUserByUsername(username: string): Promise<User>;
  findUser: (
    selector: UserQuery & { sort?: Array<SortOption> },
    options?: mongodb.FindOptions,
  ) => Promise<User>;
  findUsers: (
    query: UserQuery & {
      sort?: Array<SortOption>;
      limit?: number;
      offset?: number;
    },
  ) => Promise<Array<User>>;
  userExists: (query: { userId: string }) => Promise<boolean>;
  // Transformations
  primaryEmail: (user: User) => Email;
  userLocale: (user: User) => Intl.Locale;

  // Mutations
  createUser: (
    userData: UserData,
    options: { skipMessaging?: boolean; skipPasswordEnrollment?: boolean },
  ) => Promise<string>;
  addEmail: (userId: string, email: string) => Promise<void>;
  removeEmail: (userId: string, email: string) => Promise<void>;
  sendVerificationEmail: (userId: string, email: string) => Promise<void>;
  sendResetPasswordEmail: (userId: string, email: string, isEnrollment?: boolean) => Promise<void>;
  verifyEmail: (userId: string, email: string) => Promise<void>;
  setUsername: (userId: string, newUsername: string) => Promise<void>;
  setPassword: (userId: string, newPassword?: string) => Promise<void>;
  verifyPassword: (hashObject: Record<string, string>, password: string) => Promise<boolean>;
  addRoles: (userId: string, roles: Array<string>) => Promise<number>;
  updateAvatar: (_id: string, fileId: string) => Promise<User>;
  updateGuest: (user: User, guest: boolean) => Promise<void>;
  updateHeartbeat: (userId: string, doc: UserLastLogin) => Promise<User>;
  updateLastBillingAddress: (_id: string, lastAddress: Address) => Promise<User>;
  updateLastContact: (_id: string, lastContact: Contact) => Promise<User>;
  updateProfile: (
    _id: string,
    { profile, meta }: { profile?: UserProfile; meta?: any },
  ) => Promise<User>;
  markDeleted: (userId: string) => Promise<User>;
  deletePermanently: (params: { userId: string }) => Promise<User>;
  updateRoles: (_id: string, roles: Array<string>) => Promise<User>;
  updateTags: (_id: string, tags: Array<string>) => Promise<User>;
  updateUser: (
    selector: mongodb.Filter<User>,
    modifier: mongodb.UpdateFilter<User>,
    options: mongodb.FindOneAndUpdateOptions,
  ) => Promise<User>;
  addPushSubscription: (
    userId: string,
    subscription: any,
    options?: {
      userAgent: string;
      unsubscribeFromOtherUsers: boolean;
    },
  ) => Promise<void>;
  removePushSubscription: (userId: string, p256dh: string) => Promise<void>;
  hashPassword(password: string): Promise<{
    pbkdf2: string;
  }>;
};

const USER_EVENTS = [
  'USER_ACCOUNT_ACTION',
  'USER_CREATE',
  'USER_ADD_ROLES',
  'USER_UPDATE',
  'USER_UPDATE_PROFILE',
  'USER_UPDATE_ROLE',
  'USER_UPDATE_TAGS',
  'USER_UPDATE_AVATAR',
  'USER_UPDATE_GUEST',
  'USER_UPDATE_USERNAME',
  'USER_UPDATE_PASSWORD',
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

export const buildFindSelector = ({
  includeGuests,
  queryString,
  emailVerified,
  lastLogin,
  ...rest
}: UserQuery) => {
  const selector: mongodb.Filter<User> = { ...rest, deleted: null };
  if (!includeGuests) selector.guest = { $in: [false, null] };
  if (emailVerified === true) {
    selector['emails.verified'] = true;
  }
  if (emailVerified === false) {
    // We need to use $ne here else we'd also find users with many emails where one is
    // unverified
    selector['emails.verified'] = { $ne: true };
  }
  if (lastLogin?.start) {
    selector['lastLogin.timestamp'] = { $exists: true };
  }
  if (lastLogin?.end) {
    selector['lastLogin.timestamp'].$lte = new Date(lastLogin.end);
  }
  if (lastLogin?.start) {
    selector['lastLogin.timestamp'].$gte = new Date(lastLogin.start);
  }
  if (queryString) {
    (selector as any).$text = { $search: queryString };
  }
  return selector;
};

export const configureUsersModule = async ({
  db,
  options,
  migrationRepository,
}: ModuleInput<UserSettingsOptions>): Promise<UsersModule> => {
  userSettings.configureSettings(options || {}, db);
  registerEvents(USER_EVENTS);
  const Users = await UsersCollection(db);

  // Migration
  addMigrations(migrationRepository);

  const webAuthn = await configureUsersWebAuthnModule({ db, options });

  return {
    // Queries
    webAuthn,
    async count(query: UserQuery): Promise<number> {
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
      return Users.findOne({ 'emails.address': { $regex: email, $options: 'i' } }, {});
    },

    async findUnverifiedEmailToken(plainToken: string): Promise<{
      userId: string;
      address: string;
      when: Date;
    }> {
      if (!plainToken) return null;
      const token = await sha256(plainToken);
      const user = await Users.findOne(
        {
          'services.email.verificationTokens': {
            $elemMatch: {
              token,
              when: { $gt: new Date(new Date().getTime() - 1000 * 60 * 60) },
            },
          },
        },
        {},
      );
      if (!user) return null;
      const verificationToken = user.services.email.verificationTokens.find((v) => v.token === token);
      return {
        userId: user._id,
        ...verificationToken,
      };
    },

    async verifyEmail(userId: string, address: string): Promise<void> {
      await Users.updateOne(
        { _id: userId },
        {
          $set: {
            'emails.$[email].verified': true,
          },
          $pull: {
            'services.email.verificationTokens': {
              address,
            },
          },
        },
        {
          arrayFilters: [{ 'email.address': address }],
        },
      );

      await emit('USER_ACCOUNT_ACTION', {
        action: 'email-verified',
        address,
        userId,
      });
    },

    async findUserByResetToken(plainToken: string): Promise<User> {
      const token = await sha256(plainToken);
      const user = await Users.findOne(
        {
          'services.password.reset': {
            $elemMatch: {
              token,
              when: { $gt: new Date(new Date().getTime() - 1000 * 60 * 60) },
            },
          },
        },
        {},
      );
      return user;
    },

    async findUserByToken(plainToken?: string): Promise<User> {
      const token = await sha256(plainToken);

      if (token) {
        return Users.findOne({
          'services.token.secret': token,
        });
      }

      return null;
    },

    async findUser(
      query: UserQuery & { sort?: Array<SortOption> },
      findOptions?: mongodb.FindOptions,
    ): Promise<User> {
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
      const selector = buildFindSelector({ ...query });

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
      const userCount = await Users.countDocuments({ _id: userId, deleted: null }, { limit: 1 });
      return userCount === 1;
    },

    // Transformations
    primaryEmail(user: User): Email {
      return (user.emails || []).toSorted(
        (left, right) => Number(right.verified) - Number(left.verified),
      )?.[0];
    },

    userLocale(user: User): Intl.Locale {
      if (!user?.lastLogin?.locale) return systemLocale;
      try {
        return new Intl.Locale(user.lastLogin.locale);
      } catch {
        return systemLocale;
      }
    },

    // Mutations
    async createUser(
      {
        password,
        email,
        username,
        initialPassword,
        roles,
        webAuthnPublicKeyCredentials,
        ...userData
      }: UserData,
      {
        skipMessaging,
        skipPasswordEnrollment,
      }: { skipMessaging?: boolean; skipPasswordEnrollment?: boolean } = {},
    ): Promise<string> {
      const normalizedUserData = await userSettings.validateNewUser(userData);

      const webAuthnService =
        webAuthnPublicKeyCredentials &&
        (await this.webAuthn.verifyCredentialCreation(username, webAuthnPublicKeyCredentials));

      const services: Record<string, any> = {};

      if (email) {
        if (!(await userSettings.validateEmail(email))) {
          throw new Error(`E-Mail address ${email} is invalid`, { cause: 'EMAIL_INVALID' });
        }
      }

      if (password) {
        if (!(await userSettings.validatePassword(password))) {
          throw new Error(`Provided password is invalid`, { cause: 'PASSWORD_INVALID' });
        }
        services.password = await this.hashPassword(password);
      }

      if (webAuthnService) {
        services.webAuthn = [webAuthnService];
      }

      const doc = {
        ...normalizedUserData,
        _id: normalizedUserData._id || generateDbObjectId(),
        roles: roles || [],
        initialPassword: Boolean(initialPassword),
        services,
        emails: email ? [{ address: email, verified: false }] : [],
        created: new Date(),
      };

      if (username) {
        if (!(await userSettings.validateUsername(username))) {
          throw new Error(`Username ${username} is invalid`, { cause: 'USERNAME_INVALID' });
        }
        doc.username = username;
      }

      const { insertedId: userId } = await Users.insertOne(doc);

      try {
        const autoMessagingEnabled = skipMessaging
          ? false
          : userSettings.autoMessagingAfterUserCreation && !!email && !!userId;

        if (autoMessagingEnabled) {
          if (password === undefined) {
            if (!skipPasswordEnrollment && !webAuthnService) {
              await this.sendResetPasswordEmail(userId, email, true);
            }
          } else {
            await this.sendVerificationEmail(userId, email);
          }
        }
      } catch {
        /* */
      }

      const user = await Users.findOne({ _id: userId }, {});
      await emit('USER_CREATE', {
        user: removeConfidentialServiceHashes(user),
      });

      return userId;
    },

    async hashPassword(password) {
      const salt = pbkdf2.generateSalt();
      const hashedPassword = await pbkdf2.getDerivedKey(salt, password);
      return { pbkdf2: `${salt}:${hashedPassword}` };
    },

    async verifyPassword(
      { bcrypt: bcryptHash, pbkdf2: pbkdf2SaltAndHash }: { bcrypt?: string; pbkdf2?: string },
      plainPassword: string,
    ): Promise<boolean> {
      if (bcryptHash) {
        const password = await sha256(plainPassword);
        return bcrypt.compare(password, bcryptHash);
      }
      if (pbkdf2SaltAndHash) {
        const [pbkdf2Salt, pbkdf2Hash] = pbkdf2SaltAndHash.split(':');
        return pbkdf2.compare(plainPassword, pbkdf2Hash, pbkdf2Salt);
      }
      return false;
    },

    async addEmail(userId: string, address: string): Promise<void> {
      if (!(await userSettings.validateEmail(address))) {
        throw new Error(`E-Mail address ${address} is invalid`, { cause: 'EMAIL_INVALID' });
      }
      await this.updateUser(
        { _id: userId, 'emails.address': { $not: { $regex: address, $options: 'i' } } },
        {
          $push: {
            emails: {
              address: address.trim(),
              verified: false,
            },
          },
        },
      );
    },

    async removeEmail(userId: string, address: string): Promise<void> {
      await this.updateUser(
        { _id: userId, 'emails.address': { $regex: address, $options: 'i' } },
        {
          $pull: {
            emails: { address: { $regex: address, $options: 'i' } },
          },
        },
      );
    },

    async sendResetPasswordEmail(userId: string, email: string, isEnrollment?: boolean): Promise<void> {
      const plainToken = crypto.randomUUID();
      const resetToken = {
        token: await sha256(plainToken),
        address: email,
        when: new Date(),
      };

      await Users.updateOne(
        { _id: userId },
        {
          $push: {
            'services.password.reset': resetToken,
          },
        },
      );

      await emit('USER_ACCOUNT_ACTION', {
        action: isEnrollment ? 'enroll-account' : 'reset-password',
        userId,
        ...resetToken,
        token: plainToken,
      });
    },

    async sendVerificationEmail(userId: string, email: string): Promise<void> {
      const plainToken = crypto.randomUUID();
      const verificationToken = {
        token: await sha256(plainToken),
        address: email,
        when: new Date(),
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
        token: plainToken,
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

    async setUsername(userId: string, username: string) {
      if (!(await userSettings.validateUsername(username))) {
        throw new Error(`Username ${username} is invalid`, { cause: 'USERNAME_INVALID' });
      }
      await Users.updateOne(
        { _id: userId },
        {
          $set: {
            username: username.trim(),
          },
        },
      );
      const user = await Users.findOne({ _id: userId }, {});
      await emit('USER_UPDATE_USERNAME', {
        user: removeConfidentialServiceHashes(user),
      });
    },

    async setPassword(userId: string, plainPassword: string) {
      if (!(await userSettings.validatePassword(plainPassword))) {
        throw new Error(`Password ***** is invalid`, { cause: 'PASSWORD_INVALID' });
      }
      const password = plainPassword || crypto.randomUUID().split('-').pop();
      await Users.updateOne(
        { _id: userId },
        {
          $set: {
            initialPassword: false,
            'services.password': await this.hashPassword(
              password || crypto.randomUUID().split('-').pop(),
            ),
          },
        },
      );
      const user = await Users.findOne({ _id: userId }, {});
      await emit('USER_UPDATE_PASSWORD', {
        user: removeConfidentialServiceHashes(user),
      });
    },

    updateAvatar: async (_id: string, fileId: string): Promise<User> => {
      const userFilter = generateDbFilterById(_id);
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

    updateGuest: async (user: User, guest: boolean): Promise<void> => {
      const modifier = { $set: { guest } };
      await Users.updateOne(generateDbFilterById(user._id), modifier);
      await emit('USER_UPDATE_GUEST', {
        user: removeConfidentialServiceHashes({
          ...user,
          guest,
        }),
      });
    },

    updateHeartbeat: async (userId: string, lastLogin: UserLastLogin): Promise<User> => {
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

    markDeleted: async (userId: string): Promise<User> => {
      const user = await Users.findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            username: `deleted-${Date.now()}`,
            deleted: new Date(),
            emails: [],
            roles: [],
            profile: null,
            lastBillingAddress: null,
            services: {},
            pushSubscriptions: [],
            avatarId: null,
            initialPassword: false,
            lastContact: null,
            lastLogin: null,
          },
        },
        { returnDocument: 'after' },
      );

      await emit('USER_REMOVE', {
        user,
      });
      return user;
    },

    deletePermanently: async ({ userId }: { userId: string }): Promise<User> => {
      return Users.findOneAndDelete({ _id: userId });
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

      const user = await Users.findOneAndUpdate(userFilter, modifier, {
        returnDocument: 'after',
      });

      await emit('USER_UPDATE_PROFILE', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
    },

    updateLastBillingAddress: async (_id: string, lastBillingAddress: Address): Promise<User> => {
      const userFilter = generateDbFilterById(_id);
      const user = await Users.findOne(userFilter, {});

      if (!lastBillingAddress) return user;

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

      if (updatedUser) {
        await emit('USER_UPDATE_BILLING_ADDRESS', {
          user: removeConfidentialServiceHashes(updatedUser),
        });
      }

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

      const updatedUser = await Users.findOneAndUpdate(userFilter, modifier, {
        returnDocument: 'after',
      });

      await emit('USER_UPDATE_LAST_CONTACT', {
        user: removeConfidentialServiceHashes(user),
      });
      return updatedUser;
    },

    updateRoles: async (_id: string, roles: Array<string>): Promise<User> => {
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

    updateTags: async (_id: string, tags: Array<string>): Promise<User> => {
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

    updateUser: async (
      selector: mongodb.Filter<User>,
      modifier: mongodb.UpdateFilter<User>,
      updateOptions?: mongodb.FindOneAndUpdateOptions,
    ): Promise<User> => {
      const user = await Users.findOneAndUpdate(selector, modifier, {
        ...updateOptions,
        returnDocument: 'after',
      });
      await emit('USER_UPDATE', {
        user: removeConfidentialServiceHashes(user),
      });
      return user;
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
          } as mongodb.UpdateFilter<User>,
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
        } as mongodb.UpdateFilter<User>,
        {},
      );
    },
  };
};
