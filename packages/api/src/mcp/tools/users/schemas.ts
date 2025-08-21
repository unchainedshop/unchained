import { z } from 'zod';
import {
  PaginationSchema,
  SortingSchema,
  SearchSchema,
  DateRangeSchema,
} from '../../utils/sharedSchemas.js';

export const UserProfileSchema = z.object({
  displayName: z.string().optional().describe("User's display name shown in the interface"),
  birthday: z.string().optional().describe("User's birthday in ISO date format (YYYY-MM-DD)"),
  phoneMobile: z.string().optional().describe("User's mobile phone number"),
  address: z
    .object({
      firstName: z.string().optional().describe('First name for billing/shipping address'),
      lastName: z.string().optional().describe('Last name for billing/shipping address'),
      addressLine: z.string().optional().describe('Primary address line (street address)'),
      addressLine2: z.string().optional().describe('Secondary address line (apartment, suite, etc.)'),
      postalCode: z.string().optional().describe('Postal/ZIP code'),
      city: z.string().optional().describe('City name'),
      regionCode: z.string().optional().describe('Region/state code (e.g. "CA", "TX")'),
      countryCode: z.string().optional().describe('ISO country code (e.g. "US", "DE", "CH")'),
    })
    .optional()
    .describe("User's address information for billing and shipping"),
});

export const actionValidators = {
  LIST: z.object({
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    includeGuests: z.boolean().optional().describe('Include guest users in results'),
    emailVerified: z.boolean().optional().describe('Filter by email verification status'),
    lastLogin: z
      .object({
        start: z.string().optional(),
        end: z.string().optional(),
      })
      .optional()
      .describe('Filter by last login date range'),
  }),

  COUNT: z.object({
    ...SearchSchema,
    includeGuests: z.boolean().optional().describe('Include guest users in count'),
    emailVerified: z.boolean().optional().describe('Filter by email verification status'),
    lastLogin: z
      .object({
        start: z.string().optional(),
        end: z.string().optional(),
      })
      .optional()
      .describe('Filter by last login date range'),
  }),

  GET: z.object({
    userId: z.string().describe('User ID to retrieve'),
  }),

  CREATE: z.object({
    username: z.string().optional().describe('Username for the new user'),
    email: z.string().optional().describe('Email address for the new user'),
    password: z.string().optional().describe('Password for the new user'),
    profile: UserProfileSchema.optional().describe('User profile information'),
  }),

  UPDATE: z.object({
    userId: z.string().describe('User ID to update'),
    profile: UserProfileSchema.optional().describe('Profile updates'),
    meta: z.any().optional().describe('Additional metadata'),
  }),

  REMOVE: z.object({
    userId: z.string().describe('User ID to remove'),
    removeUserReviews: z.boolean().optional().default(false).describe('Also remove user reviews'),
  }),

  ENROLL: z.object({
    email: z.string().describe('Email address for enrollment'),
    profile: UserProfileSchema.describe('Profile information for new user'),
    password: z
      .string()
      .optional()
      .describe('Optional password (if not provided, enrollment email sent)'),
  }),

  SET_TAGS: z.object({
    userId: z.string().describe('User ID to update'),
    tags: z.array(z.string()).describe('Array of tags to assign'),
  }),

  SET_USERNAME: z.object({
    userId: z.string().describe('User ID to update'),
    username: z.string().describe('New username to set'),
  }),

  ADD_EMAIL: z.object({
    userId: z.string().optional().describe('User ID (optional, defaults to current user)'),
    email: z.string().describe('Email address to add'),
  }),

  REMOVE_EMAIL: z.object({
    userId: z.string().optional().describe('User ID (optional, defaults to current user)'),
    email: z.string().describe('Email address to remove'),
  }),

  SEND_ENROLLMENT_EMAIL: z.object({
    email: z.string().describe('Email address to send enrollment to'),
  }),

  SEND_VERIFICATION_EMAIL: z.object({
    email: z.string().optional().describe('Email address to verify (optional)'),
  }),

  REMOVE_PRODUCT_REVIEWS: z.object({
    userId: z.string().describe('User ID whose reviews to remove'),
  }),

  GET_ORDERS: z.object({
    userId: z.string().describe('User ID to get orders for'),
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    includeCarts: z.boolean().optional().default(false).describe('Include cart orders'),
    status: z.array(z.string()).optional().describe('Filter by order status'),
  }),

  GET_ENROLLMENTS: z.object({
    userId: z.string().describe('User ID to get enrollments for'),
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    status: z.array(z.string()).optional().describe('Filter by enrollment status'),
  }),

  GET_QUOTATIONS: z.object({
    userId: z.string().describe('User ID to get quotations for'),
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
  }),

  GET_BOOKMARKS: z.object({
    userId: z.string().describe('User ID to get bookmarks for'),
  }),

  GET_PAYMENT_CREDENTIALS: z.object({
    userId: z.string().describe('User ID to get payment credentials for'),
  }),

  GET_AVATAR: z.object({
    userId: z.string().describe('User ID to get avatar for'),
  }),

  GET_REVIEWS: z.object({
    userId: z.string().describe('User ID to get reviews for'),
    ...PaginationSchema,
    ...SortingSchema,
  }),

  GET_REVIEWS_COUNT: z.object({
    userId: z.string().describe('User ID to count reviews for'),
  }),
} as const;

export const UsersManagementSchema = {
  action: z
    .enum([
      'LIST',
      'COUNT',
      'GET',
      'CREATE',
      'UPDATE',
      'REMOVE',
      'ENROLL',
      'SET_TAGS',
      'SET_USERNAME',
      'ADD_EMAIL',
      'REMOVE_EMAIL',
      'SEND_ENROLLMENT_EMAIL',
      'SEND_VERIFICATION_EMAIL',
      'REMOVE_PRODUCT_REVIEWS',
      'GET_ORDERS',
      'GET_ENROLLMENTS',
      'GET_QUOTATIONS',
      'GET_BOOKMARKS',
      'GET_PAYMENT_CREDENTIALS',
      'GET_AVATAR',
      'GET_REVIEWS',
      'GET_REVIEWS_COUNT',
    ])
    .describe(
      'User management action to perform. LIST: list users with filters and pagination. COUNT: count users matching criteria. GET: retrieve single user by ID. CREATE: create new user account. UPDATE: update user profile/metadata. REMOVE: mark user as deleted. ENROLL: create user and send enrollment email. SET_TAGS: assign tags to user. SET_USERNAME: set user username. ADD_EMAIL/REMOVE_EMAIL: manage user email addresses. SEND_ENROLLMENT_EMAIL/SEND_VERIFICATION_EMAIL: trigger email workflows. REMOVE_PRODUCT_REVIEWS: delete all reviews by user. GET_ORDERS/GET_ENROLLMENTS/GET_QUOTATIONS/GET_BOOKMARKS/GET_PAYMENT_CREDENTIALS/GET_AVATAR/GET_REVIEWS/GET_REVIEWS_COUNT: retrieve user-related data with optional filtering and pagination.',
    ),
  userId: z
    .string()
    .optional()
    .describe(
      'Required for: GET, UPDATE, REMOVE, SET_TAGS, SET_USERNAME, GET_ORDERS, GET_ENROLLMENTS, GET_QUOTATIONS, GET_BOOKMARKS, GET_PAYMENT_CREDENTIALS, GET_AVATAR, GET_REVIEWS, GET_REVIEWS_COUNT, REMOVE_PRODUCT_REVIEWS. Optional for: ADD_EMAIL, REMOVE_EMAIL (defaults to current user if not provided)',
    ),

  username: z
    .string()
    .optional()
    .describe(
      'Used for: CREATE (optional username for new user), SET_USERNAME (new username to assign)',
    ),
  email: z
    .string()
    .optional()
    .describe(
      'Used for: CREATE (optional email for new user), ENROLL (required email for enrollment), ADD_EMAIL/REMOVE_EMAIL (email address to add/remove), SEND_ENROLLMENT_EMAIL/SEND_VERIFICATION_EMAIL (target email address)',
    ),
  password: z
    .string()
    .optional()
    .describe(
      'Used for: CREATE (optional password for new user), ENROLL (optional password - if not provided, enrollment email is sent)',
    ),
  profile: UserProfileSchema.optional().describe(
    'Used for: CREATE (optional profile data for new user), UPDATE (profile updates to apply), ENROLL (required profile data for new user including displayName, birthday, phoneMobile, address)',
  ),
  meta: z.any().optional().describe('Used for: UPDATE (additional metadata to store with user profile)'),
  tags: z
    .array(z.string())
    .optional()
    .describe('Used for: SET_TAGS (array of tag names to assign to user for categorization/filtering)'),
  removeUserReviews: z
    .boolean()
    .optional()
    .describe(
      'Used for: REMOVE (if true, also delete all product reviews authored by the user when removing the user account)',
    ),
  ...PaginationSchema,
  ...SortingSchema,
  ...SearchSchema,
  ...DateRangeSchema,
  includeGuests: z
    .boolean()
    .optional()
    .describe(
      'Used for: LIST, COUNT (if true, include guest/anonymous users in results, default: false)',
    ),
  emailVerified: z
    .boolean()
    .optional()
    .describe(
      'Used for: LIST, COUNT (filter users by email verification status - true: only verified emails, false: only unverified emails, undefined: all users)',
    ),
  lastLogin: z
    .object({
      start: z.string().optional().describe('ISO date string for earliest last login date'),
      end: z.string().optional().describe('ISO date string for latest last login date'),
    })
    .optional()
    .describe('Used for: LIST, COUNT (filter users by their last login date range)'),

  includeCarts: z
    .boolean()
    .optional()
    .describe(
      'Used for: GET_ORDERS (if true, include cart/open orders in results along with completed orders, default: false)',
    ),
  status: z
    .array(z.string())
    .optional()
    .describe(
      'Used for: GET_ORDERS (filter by order status like ["PENDING", "CONFIRMED"]), GET_ENROLLMENTS (filter by enrollment status like ["ACTIVE", "PAUSED"])',
    ),
};

export const UsersManagementZodSchema = z.object(UsersManagementSchema);
export type UsersManagementParams = z.infer<typeof UsersManagementZodSchema>;

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (usersModule: any, params: Params<T>) => Promise<unknown>;
