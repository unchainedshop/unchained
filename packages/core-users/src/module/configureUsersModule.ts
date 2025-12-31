/**
 * Users Module - Drizzle ORM with SQLite/Turso
 */

import {
  eq,
  and,
  inArray,
  sql,
  asc,
  desc,
  isNull,
  generateId,
  type SQL,
  type DrizzleDb,
} from '@unchainedshop/store';
import type { Address, Contact } from '@unchainedshop/utils';
import {
  users,
  rowToUser,
  type User,
  type UserRow,
  type Email,
  type UserLastLogin,
  type UserProfile,
  type UserServices,
  searchUsersFTS,
} from '../db/index.ts';
import { emit, registerEvents } from '@unchainedshop/events';
import { systemLocale, SortDirection, type SortOption, sha256 } from '@unchainedshop/utils';
import type { DateFilterInput } from '@unchainedshop/utils';
import {
  UserAccountAction,
  type UserRegistrationData,
  userSettings,
  type UserSettingsOptions,
} from '../users-settings.ts';
import { configureUsersWebAuthnModule } from './configureUsersWebAuthnModule.ts';
import * as pbkdf2 from './pbkdf2.ts';
import { verifyWeb3Signature } from '../utils/web3-verification.ts';

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
  'USER_UPDATE_WEB3_ADDRESS',
  'USER_REMOVE',
];

export type { User };

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

export const removeConfidentialServiceHashes = (rawUser: User): User => {
  const user = { ...rawUser };
  delete user?.services;
  return user;
};

export const configureUsersModule = async ({
  db,
  options,
}: {
  db: DrizzleDb;
  options?: UserSettingsOptions;
}) => {
  userSettings.configureSettings(options || {}, db);
  registerEvents(USER_EVENTS);
  const webAuthn = await configureUsersWebAuthnModule({ db });

  // Build filter conditions from query params
  const buildConditions = async (query: UserQuery): Promise<SQL[]> => {
    const conditions: SQL[] = [];

    if (!query.includeDeleted) {
      conditions.push(isNull(users.deleted));
    }

    if (!query.includeGuests) {
      conditions.push(eq(users.guest, false));
    }

    if (query.userIds?.length) {
      conditions.push(inArray(users._id, query.userIds));
    }

    if (query.username) {
      // Case-insensitive username search
      conditions.push(sql`lower(${users.username}) = lower(${query.username.trim()})`);
    }

    if (query.emailVerified === true) {
      // Check if any email is verified in the JSON array
      conditions.push(sql`EXISTS (
        SELECT 1 FROM json_each(${users.emails})
        WHERE json_extract(value, '$.verified') = 1
      )`);
    }

    if (query.emailVerified === false) {
      // All emails are unverified
      conditions.push(sql`NOT EXISTS (
        SELECT 1 FROM json_each(${users.emails})
        WHERE json_extract(value, '$.verified') = 1
      )`);
    }

    if (Array.isArray(query.tags) && query.tags.length) {
      // Check if any of the query tags exist in user's tags array
      conditions.push(sql`EXISTS (
        SELECT 1 FROM json_each(${users.tags})
        WHERE value IN (${sql.join(
          query.tags.map((t) => sql`${t}`),
          sql`,`,
        )})
      )`);
    }

    if (query.web3Verified === true) {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM json_each(json_extract(${users.services}, '$.web3'))
        WHERE json_extract(value, '$.verified') = 1
      )`);
    }

    if (query.lastLogin?.start) {
      conditions.push(
        sql`json_extract(${users.lastLogin}, '$.timestamp') >= ${new Date(query.lastLogin.start).getTime()}`,
      );
    }

    if (query.lastLogin?.end) {
      conditions.push(
        sql`json_extract(${users.lastLogin}, '$.timestamp') <= ${new Date(query.lastLogin.end).getTime()}`,
      );
    }

    if (query.queryString) {
      const matchingIds = await searchUsersFTS(db, query.queryString);
      if (matchingIds.length === 0) {
        conditions.push(sql`0 = 1`);
      } else {
        conditions.push(inArray(users._id, matchingIds));
      }
    }

    return conditions;
  };

  // Build sort expressions from query params
  const buildOrderBy = (sort?: SortOption[]) => {
    const defaultSort = [{ key: 'created', value: SortDirection.ASC }] as SortOption[];
    const effectiveSort = sort?.length ? sort : defaultSort;
    return effectiveSort.map((s) => {
      if (s.key === 'created') {
        return s.value === SortDirection.DESC ? desc(users.created) : asc(users.created);
      }
      if (s.key === 'username') {
        return s.value === SortDirection.DESC ? desc(users.username) : asc(users.username);
      }
      return s.value === SortDirection.DESC ? desc(users.created) : asc(users.created);
    });
  };

  // Helper to find user by ID
  const findUserById = async (userId: string): Promise<User | null> => {
    if (!userId) return null;
    const [row] = await db.select().from(users).where(eq(users._id, userId)).limit(1);
    return row ? rowToUser(row) : null;
  };

  // Helper to update user and emit event
  const updateAndEmit = async (
    userId: string,
    updates: Partial<UserRow>,
    eventType?: string,
  ): Promise<User | null> => {
    await db
      .update(users)
      .set({ ...updates, updated: new Date() })
      .where(eq(users._id, userId));

    const user = await findUserById(userId);
    if (user && eventType) {
      await emit(eventType, {
        user: removeConfidentialServiceHashes(user),
      });
    }
    return user;
  };

  return {
    // Queries
    webAuthn,

    async count(query: UserQuery): Promise<number> {
      const conditions = await buildConditions(query);
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(users);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions)) as typeof countQuery;
      }
      const [{ count }] = await countQuery;
      return count ?? 0;
    },

    findUserById,

    async findUserByUsername(username: string): Promise<User | null> {
      if (!username) return null;
      const [row] = await db
        .select()
        .from(users)
        .where(sql`lower(${users.username}) = lower(${username.trim()})`)
        .limit(1);
      return row ? rowToUser(row) : null;
    },

    async findUserByEmail(email: string): Promise<User | null> {
      if (!email) return null;
      const [row] = await db
        .select()
        .from(users)
        .where(
          sql`EXISTS (
          SELECT 1 FROM json_each(${users.emails})
          WHERE lower(json_extract(value, '$.address')) = lower(${email.trim()})
        )`,
        )
        .limit(1);
      return row ? rowToUser(row) : null;
    },

    async findUnverifiedEmailToken(plainToken: string): Promise<{
      userId: string;
      address: string;
      when: Date;
    } | null> {
      if (!plainToken) return null;
      const token = await sha256(plainToken);
      const earliestValid = userSettings.earliestValidTokenDate(UserAccountAction.VERIFY_EMAIL);

      // Find user with matching token
      const rows = await db.select().from(users).where(sql`EXISTS (
          SELECT 1 FROM json_each(json_extract(${users.services}, '$.email.verificationTokens'))
          WHERE json_extract(value, '$.token') = ${token}
        )`);

      for (const row of rows) {
        const user = rowToUser(row);
        const tokens = user.services?.email?.verificationTokens || [];
        const verificationToken = tokens.find(
          (v) => v.token === token && new Date(v.when) > earliestValid,
        );
        if (verificationToken) {
          return {
            userId: user._id,
            address: verificationToken.address,
            when: new Date(verificationToken.when),
          };
        }
      }
      return null;
    },

    async verifyEmail(userId: string, address: string): Promise<void> {
      const user = await findUserById(userId);
      if (!user) return;

      // Update the email to verified
      const updatedEmails = user.emails.map((e) => {
        if (e.address.toLowerCase() === address.toLowerCase()) {
          return { ...e, verified: true };
        }
        return e;
      });

      // Remove verification tokens for this address
      const services = user.services || {};
      if (services.email?.verificationTokens) {
        services.email.verificationTokens = services.email.verificationTokens.filter(
          (t) => t.address.toLowerCase() !== address.toLowerCase(),
        );
      }

      await db
        .update(users)
        .set({ emails: updatedEmails, services, updated: new Date() })
        .where(eq(users._id, userId));

      await emit('USER_ACCOUNT_ACTION', {
        action: UserAccountAction.EMAIL_VERIFIED,
        address,
        userId,
      });
    },

    async findResetToken(plainToken: string): Promise<{
      userId: string;
      address: string;
      when: Date;
      token: string;
    } | null> {
      const token = await sha256(plainToken);
      const earliestValid = userSettings.earliestValidTokenDate(UserAccountAction.RESET_PASSWORD);

      const rows = await db.select().from(users).where(sql`EXISTS (
          SELECT 1 FROM json_each(json_extract(${users.services}, '$.password.reset'))
          WHERE json_extract(value, '$.token') = ${token}
        )`);

      for (const row of rows) {
        const user = rowToUser(row);
        const resets = user.services?.password?.reset || [];
        const resetToken = resets.find((v) => v.token === token && new Date(v.when) > earliestValid);
        if (resetToken) {
          return {
            userId: user._id,
            address: resetToken.address,
            when: new Date(resetToken.when),
            token: resetToken.token,
          };
        }
      }
      return null;
    },

    async findUserByToken(plainToken: string): Promise<User | null> {
      const token = await sha256(plainToken);
      if (!token) return null;

      const [row] = await db
        .select()
        .from(users)
        .where(sql`json_extract(${users.services}, '$.token.secret') = ${token}`)
        .limit(1);

      return row ? rowToUser(row) : null;
    },

    async findUser(query: UserQuery & { sort?: SortOption[] }): Promise<User | null> {
      const conditions = await buildConditions(query);
      let baseQuery = db.select().from(users);
      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions)) as typeof baseQuery;
      }
      const [row] = await baseQuery.limit(1);
      return row ? rowToUser(row) : null;
    },

    async findUsers({
      limit,
      offset,
      sort,
      ...query
    }: UserQuery & {
      sort?: SortOption[];
      limit?: number;
      offset?: number;
    }): Promise<User[]> {
      const conditions = await buildConditions(query);
      const orderBy = buildOrderBy(sort);

      let baseQuery = db.select().from(users);
      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions)) as typeof baseQuery;
      }

      const results = await baseQuery
        .orderBy(...orderBy)
        .limit(limit ?? 1000)
        .offset(offset ?? 0);

      return results.map(rowToUser);
    },

    async userExists({ userId }: { userId: string }): Promise<boolean> {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users._id, userId), isNull(users.deleted)));
      return count === 1;
    },

    // Transformations
    primaryEmail(user: User): Email {
      return (user.emails || []).toSorted(
        (left, right) => Number(right.verified) - Number(left.verified),
      )?.[0];
    },

    userLocale(user: User | null): Intl.Locale {
      if (!user?.lastLogin?.locale) return systemLocale;
      try {
        return new Intl.Locale(user.lastLogin.locale);
      } catch {
        return systemLocale;
      }
    },

    // Mutations
    async createUser(
      rawUserData: UserRegistrationData,
      {
        skipMessaging,
        skipPasswordEnrollment,
      }: { skipMessaging?: boolean; skipPasswordEnrollment?: boolean } = {},
    ): Promise<string> {
      const validatedData = await userSettings.validateNewUser(rawUserData);
      const { password, email, webAuthnPublicKeyCredentials } = validatedData;
      // Extract User properties from validated data
      const username = validatedData.username;
      const initialPassword = validatedData.initialPassword;
      const roles = validatedData.roles;

      const webAuthnService =
        webAuthnPublicKeyCredentials &&
        (await this.webAuthn.verifyCredentialCreation(username || '', webAuthnPublicKeyCredentials));

      if (webAuthnPublicKeyCredentials && !webAuthnService) {
        throw new Error('WebAuthn credential verification failed', { cause: 'WEBAUTHN_INVALID' });
      }

      const services: UserServices = {};

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

      const userId = validatedData._id || generateId();

      if (username) {
        if (!(await userSettings.validateUsername(username))) {
          throw new Error(`Username ${username} is invalid`, { cause: 'USERNAME_INVALID' });
        }
      }

      await db.insert(users).values({
        _id: userId,
        username: username || null,
        roles: roles || [],
        initialPassword: Boolean(initialPassword),
        services,
        guest: Boolean(validatedData.guest),
        pushSubscriptions: validatedData.pushSubscriptions || [],
        emails: email ? [{ address: email, verified: false }] : [],
        profile: validatedData.profile,
        meta: validatedData.meta,
        tags: validatedData.tags,
        created: new Date(),
      });

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

      const user = await findUserById(userId);
      if (user) {
        await emit('USER_CREATE', {
          user: removeConfidentialServiceHashes(user),
        });
      }

      return userId;
    },

    async hashPassword(password: string): Promise<{
      pbkdf2: string;
    }> {
      const salt = pbkdf2.generateSalt();
      const hashedPassword = await pbkdf2.getDerivedKey(salt, password);
      return { pbkdf2: `${salt}:${hashedPassword}` };
    },

    async verifyPassword(
      { pbkdf2: pbkdf2SaltAndHash }: { pbkdf2?: string },
      plainPassword: string,
    ): Promise<boolean> {
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
      const user = await findUserById(userId);
      if (!user) return;

      // Check if email already exists
      const exists = user.emails.some((e) => e.address.toLowerCase() === address.toLowerCase());
      if (exists) return;

      const updatedEmails = [...user.emails, { address: address.trim(), verified: false }];
      await db
        .update(users)
        .set({ emails: updatedEmails, updated: new Date() })
        .where(eq(users._id, userId));
    },

    async removeEmail(userId: string, address: string): Promise<void> {
      const user = await findUserById(userId);
      if (!user) return;

      const updatedEmails = user.emails.filter((e) => e.address.toLowerCase() !== address.toLowerCase());
      await db
        .update(users)
        .set({ emails: updatedEmails, updated: new Date() })
        .where(eq(users._id, userId));
    },

    // Web3 Address Management
    async addWeb3Address(userId: string, address: string): Promise<User | null> {
      const user = await findUserById(userId);
      if (!user) return null;

      const existingEntry = user.services?.web3?.find(
        (service) => service.address.toLowerCase() === address.toLowerCase(),
      );

      if (existingEntry) return user;

      const nonce = Math.floor(Math.random() * 1000000).toString();
      const services = user.services || {};
      services.web3 = [...(services.web3 || []), { address, nonce }];

      const updatedUser = await updateAndEmit(userId, { services }, 'USER_UPDATE_WEB3_ADDRESS');
      return updatedUser;
    },

    async removeWeb3Address(userId: string, address: string): Promise<User | null> {
      const user = await findUserById(userId);
      if (!user) return null;

      const existingEntry = user.services?.web3?.find(
        (service) => service.address.toLowerCase() === address.toLowerCase(),
      );

      if (!existingEntry) return null;

      const services = user.services || {};
      services.web3 = (services.web3 || []).filter(
        (s) => s.address.toLowerCase() !== address.toLowerCase(),
      );

      const updatedUser = await updateAndEmit(userId, { services }, 'USER_UPDATE_WEB3_ADDRESS');
      return updatedUser;
    },

    findWeb3Address(
      user: User,
      address: string,
    ): { address: string; nonce?: string; verified?: boolean } | null {
      return (
        user.services?.web3?.find(
          (service) => service.address.toLowerCase() === address.toLowerCase(),
        ) || null
      );
    },

    async addWebAuthnCredential(
      userId: string,
      webAuthnService: { id: string; publicKey: string; created: Date },
    ): Promise<User | null> {
      const user = await findUserById(userId);
      if (!user) return null;

      const services = user.services || {};
      services.webAuthn = [...(services.webAuthn || []), webAuthnService];

      return updateAndEmit(userId, { services }, undefined);
    },

    async removeWebAuthnCredential(userId: string, credentialsId: string): Promise<User | null> {
      const user = await findUserById(userId);
      if (!user) return null;

      const services = user.services || {};
      services.webAuthn = (services.webAuthn || []).filter((s) => s.id !== credentialsId);

      return updateAndEmit(userId, { services }, undefined);
    },

    async createAccessToken(username: string): Promise<{ user: User; token: string } | null> {
      // Generate high-entropy token using CSPRNG (128 bits of entropy)
      const plainToken = crypto.randomUUID();
      // SHA-256 is appropriate for high-entropy tokens (OWASP recommendation)
      const secret = await sha256(plainToken);
      const user = await this.findUserByUsername(username);
      if (!user) return null;

      const services = user.services || {};
      services.token = { secret };

      const updatedUser = await updateAndEmit(user._id, { services }, undefined);
      if (!updatedUser) return null;
      // Return plain token to caller - this is the only time it's available
      return { user: updatedUser, token: plainToken };
    },

    /**
     * @deprecated Use createAccessToken() instead which generates secure tokens.
     * This method accepts user-provided secrets which may have insufficient entropy.
     */
    async setAccessToken(username: string, plainSecret: string): Promise<User | null> {
      const secret = await sha256(plainSecret);
      const user = await this.findUserByUsername(username);
      if (!user) return null;

      const services = user.services || {};
      services.token = { secret };

      return updateAndEmit(user._id, { services }, undefined);
    },

    async verifyWeb3SignatureAndUpdate(
      user: User,
      credentials: { address: string; nonce: string },
      signature: `0x${string}`,
    ): Promise<User | null> {
      const isValid = await verifyWeb3Signature(credentials.nonce, signature, credentials.address);
      if (!isValid) return null;

      const services = user.services || {};
      services.web3 = (services.web3 || []).map((service) => {
        if (service.address.toLowerCase() === credentials.address.toLowerCase()) {
          return {
            ...service,
            nonce: undefined,
            verified: true,
          };
        }
        return service;
      });

      const updatedUser = await updateAndEmit(user._id, { services }, 'USER_UPDATE_WEB3_ADDRESS');
      return updatedUser;
    },

    async sendResetPasswordEmail(userId: string, email: string, isEnrollment?: boolean): Promise<void> {
      const plainToken = crypto.randomUUID();
      const resetToken = {
        token: await sha256(plainToken),
        address: email,
        when: new Date(),
      };

      const user = await findUserById(userId);
      if (!user) return;

      const services = user.services || {};
      if (!services.password) services.password = {};
      services.password.reset = [...(services.password.reset || []), resetToken];

      await db.update(users).set({ services, updated: new Date() }).where(eq(users._id, userId));

      await emit('USER_ACCOUNT_ACTION', {
        action: isEnrollment ? UserAccountAction.ENROLL_ACCOUNT : UserAccountAction.RESET_PASSWORD,
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

      const user = await findUserById(userId);
      if (!user) return;

      const services = user.services || {};
      if (!services.email) services.email = {};
      services.email.verificationTokens = [
        ...(services.email.verificationTokens || []),
        verificationToken,
      ];

      await db.update(users).set({ services, updated: new Date() }).where(eq(users._id, userId));

      await emit('USER_ACCOUNT_ACTION', {
        action: UserAccountAction.VERIFY_EMAIL,
        userId,
        ...verificationToken,
        token: plainToken,
      });
    },

    addRoles: async (userId: string, roles: string[]): Promise<User | null> => {
      const user = await findUserById(userId);
      if (!user) return null;

      const uniqueRoles = [...new Set([...user.roles, ...roles])];
      const updatedUser = await updateAndEmit(userId, { roles: uniqueRoles }, 'USER_ADD_ROLES');
      return updatedUser;
    },

    async setUsername(userId: string, username: string): Promise<User | null> {
      if (!(await userSettings.validateUsername(username))) {
        throw new Error(`Username ${username} is invalid`, { cause: 'USERNAME_INVALID' });
      }
      return updateAndEmit(userId, { username: username.trim() }, 'USER_UPDATE_USERNAME');
    },

    async setPassword(userId: string, plainPassword: string): Promise<User | null> {
      if (!(await userSettings.validatePassword(plainPassword))) {
        throw new Error(`Password ***** is invalid`, { cause: 'PASSWORD_INVALID' });
      }
      const password = plainPassword || crypto.randomUUID().split('-').pop();
      const user = await findUserById(userId);
      if (!user) return null;

      const services = user.services || {};
      services.password = {
        ...services.password,
        ...(await this.hashPassword(password || crypto.randomUUID().split('-').pop())),
      };

      return updateAndEmit(userId, { services, initialPassword: false }, 'USER_UPDATE_PASSWORD');
    },

    async resetPassword(token: string, newPassword: string): Promise<User | null> {
      const resetToken = await this.findResetToken(token);
      if (!resetToken) return null;

      const updatedUser = await this.setPassword(resetToken.userId, newPassword);
      if (updatedUser) {
        // Invalidate the reset token
        const user = await findUserById(resetToken.userId);
        if (user) {
          const services = user.services || {};
          if (services.password?.reset) {
            services.password.reset = services.password.reset.filter(
              (r) => r.token !== resetToken.token,
            );
          }
          await db.update(users).set({ services, updated: new Date() }).where(eq(users._id, user._id));
        }

        await emit('USER_ACCOUNT_ACTION', {
          action: UserAccountAction.PASSWORD_RESETTED,
          userId: updatedUser._id,
        });

        await this.verifyEmail(updatedUser._id, resetToken.address);
      }
      return updatedUser;
    },

    updateAvatar: async (_id: string, fileId: string): Promise<User | null> => {
      return updateAndEmit(_id, { avatarId: fileId }, 'USER_UPDATE_AVATAR');
    },

    updateGuest: async (user: User, guest: boolean): Promise<User | null> => {
      return updateAndEmit(user._id, { guest }, 'USER_UPDATE_GUEST');
    },

    updateHeartbeat: async (userId: string, lastLogin: UserLastLogin): Promise<User | null> => {
      const updatedLastLogin = {
        timestamp: new Date(),
        ...lastLogin,
      };
      return updateAndEmit(userId, { lastLogin: updatedLastLogin }, 'USER_UPDATE_HEARTBEAT');
    },

    markDeleted: async (userId: string): Promise<User | null> => {
      // Note: Sessions cleanup would need to be handled by the session module
      const user = await findUserById(userId);
      if (!user) return null;

      await db
        .update(users)
        .set({
          username: `deleted-${Date.now()}`,
          deleted: new Date(),
          emails: [],
          roles: [],
          services: {},
          pushSubscriptions: [],
          initialPassword: false,
          profile: null,
          lastBillingAddress: null,
          lastContact: null,
          lastLogin: null,
          avatarId: null,
          updated: new Date(),
        })
        .where(eq(users._id, userId));

      const deletedUser = await findUserById(userId);
      if (deletedUser) {
        await emit('USER_REMOVE', { user: deletedUser });
      }
      return deletedUser;
    },

    deletePermanently: async ({ userId }: { userId: string }): Promise<User | null> => {
      const user = await findUserById(userId);
      if (!user) return null;
      await db.delete(users).where(eq(users._id, userId));
      return user;
    },

    updateProfile: async (
      userId: string,
      updatedData: { profile?: UserProfile; meta?: any },
    ): Promise<User | null> => {
      const { meta, profile } = updatedData;

      if (!meta && !profile) {
        return findUserById(userId);
      }

      const user = await findUserById(userId);
      if (!user) return null;

      const updates: Partial<UserRow> = {};

      if (profile) {
        updates.profile = { ...user.profile, ...profile };
      }

      if (meta) {
        updates.meta = meta;
      }

      return updateAndEmit(userId, updates, 'USER_UPDATE_PROFILE');
    },

    updateLastBillingAddress: async (_id: string, lastBillingAddress: Address): Promise<User | null> => {
      const user = await findUserById(_id);
      if (!user) return null;
      if (!lastBillingAddress) return user;

      const updates: Partial<UserRow> = { lastBillingAddress };
      const profile = user.profile || {};
      const isGuest = !!user.guest;

      if (!profile.displayName || isGuest) {
        updates.profile = {
          ...profile,
          displayName: [lastBillingAddress.firstName, lastBillingAddress.lastName]
            .filter(Boolean)
            .join(' '),
        };
      }

      return updateAndEmit(_id, updates, 'USER_UPDATE_BILLING_ADDRESS');
    },

    updateLastContact: async (_id: string, lastContact: Contact): Promise<User | null> => {
      const user = await findUserById(_id);
      if (!user) return null;

      const profile = user.profile || {};
      const isGuest = !!user.guest;

      const updates: Partial<UserRow> = { lastContact };

      if ((!profile.phoneMobile || isGuest) && lastContact.telNumber) {
        updates.profile = {
          ...profile,
          phoneMobile: lastContact.telNumber,
        };
      }

      return updateAndEmit(_id, updates, 'USER_UPDATE_LAST_CONTACT');
    },

    updateRoles: async (_id: string, roles: string[]): Promise<User | null> => {
      return updateAndEmit(_id, { roles }, 'USER_UPDATE_ROLE');
    },

    updateTags: async (_id: string, tags: string[]): Promise<User | null> => {
      return updateAndEmit(_id, { tags }, 'USER_UPDATE_TAGS');
    },

    updateUser: async (userId: string, updates: Partial<User>): Promise<User | null> => {
      const user = await findUserById(userId);
      if (!user) return null;

      const rowUpdates: Partial<UserRow> = {};
      if (updates.emails !== undefined) rowUpdates.emails = updates.emails;
      if (updates.roles !== undefined) rowUpdates.roles = updates.roles;
      if (updates.tags !== undefined) rowUpdates.tags = updates.tags;
      if (updates.profile !== undefined) rowUpdates.profile = updates.profile;
      if (updates.meta !== undefined) rowUpdates.meta = updates.meta;
      if (updates.services !== undefined) rowUpdates.services = updates.services;
      if (updates.guest !== undefined) rowUpdates.guest = updates.guest;
      if (updates.avatarId !== undefined) rowUpdates.avatarId = updates.avatarId;
      if (updates.username !== undefined) rowUpdates.username = updates.username;
      if (updates.initialPassword !== undefined) rowUpdates.initialPassword = updates.initialPassword;
      if (updates.lastLogin !== undefined) rowUpdates.lastLogin = updates.lastLogin;
      if (updates.lastBillingAddress !== undefined)
        rowUpdates.lastBillingAddress = updates.lastBillingAddress;
      if (updates.lastContact !== undefined) rowUpdates.lastContact = updates.lastContact;
      if (updates.pushSubscriptions !== undefined)
        rowUpdates.pushSubscriptions = updates.pushSubscriptions;

      return updateAndEmit(userId, rowUpdates, 'USER_UPDATE');
    },

    addPushSubscription: async (
      userId: string,
      subscription: any,
      subscriptionOptions?: {
        userAgent: string;
        unsubscribeFromOtherUsers: boolean;
      },
    ): Promise<void> => {
      const user = await findUserById(userId);
      if (!user) return;

      // Check if subscription already exists
      const exists = user.pushSubscriptions.some((s) => s.keys?.p256dh === subscription?.keys?.p256dh);
      if (exists) return;

      const updatedSubscriptions = [
        ...user.pushSubscriptions,
        {
          userAgent: subscriptionOptions?.userAgent,
          ...subscription,
        },
      ];

      await db
        .update(users)
        .set({ pushSubscriptions: updatedSubscriptions, updated: new Date() })
        .where(eq(users._id, userId));

      // Unsubscribe from other users if requested
      if (subscriptionOptions?.unsubscribeFromOtherUsers) {
        const otherUsers = await db.select().from(users).where(sql`${users._id} != ${userId} AND EXISTS (
            SELECT 1 FROM json_each(${users.pushSubscriptions})
            WHERE json_extract(value, '$.keys.p256dh') = ${subscription?.keys?.p256dh}
          )`);

        for (const otherUser of otherUsers) {
          const filtered = (otherUser.pushSubscriptions || []).filter(
            (s) => s.keys?.p256dh !== subscription?.keys?.p256dh,
          );
          await db
            .update(users)
            .set({ pushSubscriptions: filtered, updated: new Date() })
            .where(eq(users._id, otherUser._id));
        }
      }
    },

    removePushSubscription: async (userId: string, p256dh: string): Promise<void> => {
      const user = await findUserById(userId);
      if (!user) return;

      const filtered = user.pushSubscriptions.filter((s) => s.keys?.p256dh !== p256dh);
      await db
        .update(users)
        .set({ pushSubscriptions: filtered, updated: new Date() })
        .where(eq(users._id, userId));
    },

    existingTags: async (): Promise<string[]> => {
      const rows = await db
        .select({ tags: users.tags })
        .from(users)
        .where(and(sql`${users.tags} IS NOT NULL`, isNull(users.deleted)));

      const allTags = new Set<string>();
      for (const row of rows) {
        if (Array.isArray(row.tags)) {
          for (const tag of row.tags) {
            if (tag) allTags.add(tag);
          }
        }
      }
      return [...allTags].sort();
    },
  };
};

export type UsersModule = Awaited<ReturnType<typeof configureUsersModule>>;
