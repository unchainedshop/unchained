import { Context } from '../../context.js';
import { SortOption, DateFilterInput } from '@unchainedshop/utils';
import { removeConfidentialServiceHashes, UserProfile } from '@unchainedshop/core-users';
import { OrderStatus } from '@unchainedshop/core-orders';
import { EnrollmentStatus } from '@unchainedshop/core-enrollments';
import {
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
  PasswordInvalidError,
  AuthOperationFailedError,
} from '../../errors.js';

export interface UserListOptions {
  limit?: number;
  offset?: number;
  includeGuests?: boolean;
  queryString?: string;
  sort?: SortOption[];
  emailVerified?: boolean;
  lastLogin?: DateFilterInput;
}

export interface UserCountOptions {
  includeGuests?: boolean;
  queryString?: string;
  emailVerified?: boolean;
  lastLogin?: DateFilterInput;
}

export interface CreateUserOptions {
  username?: string;
  email?: string;
  password?: string;
  profile?: UserProfile;
}

export interface UpdateUserOptions {
  userId: string;
  profile?: UserProfile;
  meta?: any;
}

export interface EnrollUserOptions {
  email: string;
  profile: UserProfile;
  password?: string;
}

export interface SetUserRolesOptions {
  userId: string;
  roles: string[];
}

export interface SetUserTagsOptions {
  userId: string;
  tags: string[];
}

export interface SetPasswordOptions {
  userId: string;
  newPassword: string;
}

export interface SetUsernameOptions {
  userId: string;
  username: string;
}

export interface AddEmailOptions {
  userId?: string;
  email: string;
}

export interface RemoveEmailOptions {
  userId?: string;
  email: string;
}

export const configureUsersMcpModule = (context: Context) => {
  const { modules, loaders } = context;
  return {
    list: async (options?: UserListOptions) => {
      const {
        limit = 20,
        offset = 0,
        includeGuests = false,
        queryString,
        sort,
        emailVerified,
        lastLogin,
      } = options || {};

      const users = await modules.users.findUsers({
        includeGuests,
        queryString,
        emailVerified,
        lastLogin,
        limit,
        offset,
        sort,
      });

      return users.map(removeConfidentialServiceHashes);
    },

    count: async (options?: UserCountOptions) => {
      const { includeGuests = false, queryString, emailVerified, lastLogin } = options || {};

      return modules.users.count({
        includeGuests,
        queryString,
        emailVerified,
        lastLogin,
      });
    },

    get: async ({ userId }: { userId?: string }) => {
      if (!userId) {
        return null;
      }
      const user = await modules.users.findUserById(userId);
      return removeConfidentialServiceHashes(user);
    },

    create: async (options: CreateUserOptions) => {
      const { username, email, password, profile } = options;

      try {
        const newUserId = await modules.users.createUser(
          {
            username,
            email,
            password,
            profile,
            initialPassword: false,
          },
          {},
        );

        const user = await context.modules.users.updateHeartbeat(newUserId, {
          remoteAddress: context.remoteAddress,
          remotePort: context.remotePort,
          userAgent: context.getHeader('user-agent'),
          locale: context.locale?.baseName,
          countryCode: context.countryCode,
        });
        return removeConfidentialServiceHashes(user);
      } catch (e) {
        if (e.cause === 'EMAIL_INVALID') throw new EmailAlreadyExistsError({ email: options?.email });
        else if (e.cause === 'USERNAME_INVALID')
          throw new UsernameAlreadyExistsError({ username: options?.username });
        else if (e.cause === 'PASSWORD_INVALID')
          throw new PasswordInvalidError({ username: options?.username });
        else throw new AuthOperationFailedError({ username: options?.username, email: options.email });
      }
    },

    update: async (options: UpdateUserOptions) => {
      const { userId, profile, meta } = options;

      const user = await modules.users.updateProfile(userId, { profile, meta });
      return removeConfidentialServiceHashes(user);
    },

    remove: async ({ userId, removeUserReviews }: { userId?: string; removeUserReviews?: boolean }) => {
      if (!userId) {
        throw new Error('userId is required');
      }
      if (removeUserReviews) {
        await modules.products.reviews.deleteMany({ authorId: userId });
      }
      await modules.users.markDeleted(userId);
      const user = await modules.users.findUserById(userId);
      return removeConfidentialServiceHashes(user);
    },

    enroll: async (options: EnrollUserOptions) => {
      const { email, profile, password } = options;

      const userId = await modules.users.createUser({
        email,
        password,
        ...profile,
      });

      if (!password) {
        await modules.users.sendResetPasswordEmail(userId, email, true);
      }

      const user = await modules.users.findUserById(userId);
      return removeConfidentialServiceHashes(user);
    },

    setRoles: async (options: SetUserRolesOptions) => {
      const { userId, roles } = options;
      await modules.users.updateRoles(userId, roles);

      const user = await modules.users.findUserById(userId);
      return removeConfidentialServiceHashes(user);
    },

    setTags: async (options: SetUserTagsOptions) => {
      const { userId, tags } = options;

      await modules.users.updateTags(userId, tags);
      const user = await modules.users.findUserById(userId);
      return removeConfidentialServiceHashes(user);
    },

    setPassword: async (options: SetPasswordOptions) => {
      const { userId, newPassword } = options;

      await modules.users.setPassword(userId, newPassword);
      const user = await modules.users.findUserById(userId);
      return removeConfidentialServiceHashes(user);
    },

    setUsername: async (options: SetUsernameOptions) => {
      const { userId, username } = options;

      await modules.users.setUsername(userId, username);
      const user = await modules.users.findUserById(userId);
      return removeConfidentialServiceHashes(user);
    },

    addEmail: async (options: AddEmailOptions) => {
      const { userId, email } = options;

      await modules.users.addEmail(userId, email);
      const user = await modules.users.findUserById(userId);
      return removeConfidentialServiceHashes(user);
    },

    removeEmail: async (options: RemoveEmailOptions) => {
      const { userId, email } = options;

      await modules.users.removeEmail(userId, email);
      const user = await modules.users.findUserById(userId);
      return removeConfidentialServiceHashes(user);
    },

    sendEnrollmentEmail: async ({ email }: { email: string }) => {
      const user = await modules.users.findUserByEmail(email);
      if (user) {
        await modules.users.sendResetPasswordEmail(user._id, email, true);
      }
      return { success: !!user };
    },

    sendVerificationEmail: async ({ email }: { email?: string }) => {
      const targetEmail = email || context.user?.emails?.[0]?.address;
      if (!targetEmail) {
        throw new Error('No email provided or user has no email');
      }
      const user = await modules.users.findUserByEmail(targetEmail);
      if (user) {
        await modules.users.sendVerificationEmail(user._id, targetEmail);
      }
      return { success: !!user };
    },

    removeProductReviews: async ({ userId }: { userId: string }) => {
      const result = await modules.products.reviews.deleteMany({ authorId: userId });
      return { deletedCount: result };
    },

    getOrders: async ({
      userId,
      includeCarts = false,
      sort,
      queryString,
      status,
      limit = 10,
      offset = 0,
    }: {
      userId: string;
      includeCarts?: boolean;
      sort?: SortOption[];
      queryString?: string;
      status?: OrderStatus[];
      limit?: number;
      offset?: number;
    }) => {
      return modules.orders.findOrders(
        {
          userId,
          includeCarts,
          queryString,
          status,
        },
        {
          skip: offset,
          limit,
          sort: sort?.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
          }, {} as any),
        },
      );
    },

    getEnrollments: async ({
      userId,
      sort,
      queryString,
      status,
      limit = 10,
      offset = 0,
    }: {
      userId: string;
      sort?: SortOption[];
      queryString?: string;
      status?: EnrollmentStatus[];
      limit?: number;
      offset?: number;
    }) => {
      return modules.enrollments.findEnrollments({
        userId,
        queryString,
        status,
        offset,
        limit,
        sort,
      });
    },

    getQuotations: async ({
      userId,
      sort,
      queryString,
      limit = 10,
      offset = 0,
    }: {
      userId: string;
      sort?: SortOption[];
      queryString?: string;
      limit?: number;
      offset?: number;
    }) => {
      return modules.quotations.findQuotations(
        {
          userId,
          queryString,
        },
        {
          skip: offset,
          limit,
          sort: sort?.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
          }, {} as any),
        },
      );
    },

    getBookmarks: async ({ userId }: { userId: string }) => {
      return modules.bookmarks.findBookmarksByUserId(userId);
    },

    getPaymentCredentials: async ({ userId }: { userId: string }) => {
      return modules.payment.paymentCredentials.findPaymentCredentials(
        { userId },
        {
          sort: {
            created: -1,
          },
        },
      );
    },

    getAvatar: async ({ userId }: { userId: string }) => {
      const user = await modules.users.findUserById(userId);
      if (!user?.avatarId) {
        return null;
      }

      return loaders.fileLoader.load({
        fileId: user.avatarId,
      });
    },

    getReviews: async ({
      userId,
      sort,
      limit = 10,
      offset = 0,
    }: {
      userId: string;
      sort?: SortOption[];
      limit?: number;
      offset?: number;
    }) => {
      return modules.products.reviews.findProductReviews({
        authorId: userId,
        offset,
        limit,
        sort,
      });
    },

    getReviewsCount: async ({ userId }: { userId: string }) => {
      return modules.products.reviews.count({
        authorId: userId,
      });
    },
  };
};

export type UsersManagementMcpModule = ReturnType<typeof configureUsersMcpModule>;
