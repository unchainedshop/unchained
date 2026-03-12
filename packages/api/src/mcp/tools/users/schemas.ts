import { z } from 'zod/v4-mini';
import {
  PaginationSchema,
  SortingSchema,
  SearchSchema,
  createManagementSchemaFromValidators,
} from '../../utils/sharedSchemas.ts';

export const UserProfileSchema = z.object({
  displayName: z.optional(z.string()).check(z.describe("User's display name shown in the interface")),
  birthday: z.optional(z.string()).check(z.describe("User's birthday in ISO date format (YYYY-MM-DD)")),
  phoneMobile: z.optional(z.string()).check(z.describe("User's mobile phone number")),
  address: z
    .optional(
      z.object({
        firstName: z.optional(z.string()).check(z.describe('First name for billing/shipping address')),
        lastName: z.optional(z.string()).check(z.describe('Last name for billing/shipping address')),
        addressLine: z.optional(z.string()).check(z.describe('Primary address line (street address)')),
        addressLine2: z
          .optional(z.string())
          .check(z.describe('Secondary address line (apartment, suite, etc.)')),
        postalCode: z.optional(z.string()).check(z.describe('Postal/ZIP code')),
        city: z.optional(z.string()).check(z.describe('City name')),
        regionCode: z.optional(z.string()).check(z.describe('Region/state code (e.g. "CA", "TX")')),
        countryCode: z
          .optional(z.string())
          .check(z.describe('ISO country code (e.g. "US", "DE", "CH")')),
      }),
    )
    .check(z.describe("User's address information for billing and shipping")),
});

export const actionValidators = {
  LIST: z.object({
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    includeGuests: z.optional(z.boolean()).check(z.describe('Include guest users in results')),
    emailVerified: z.optional(z.boolean()).check(z.describe('Filter by email verification status')),
    lastLogin: z
      .optional(
        z.object({
          start: z.optional(z.string()),
          end: z.optional(z.string()),
        }),
      )
      .check(z.describe('Filter by last login date range')),
  }),

  COUNT: z.object({
    ...SearchSchema,
    includeGuests: z.optional(z.boolean()).check(z.describe('Include guest users in count')),
    emailVerified: z.optional(z.boolean()).check(z.describe('Filter by email verification status')),
    lastLogin: z
      .optional(
        z.object({
          start: z.optional(z.string()),
          end: z.optional(z.string()),
        }),
      )
      .check(z.describe('Filter by last login date range')),
  }),

  GET: z.object({
    userId: z.string().check(z.describe('User ID to retrieve')),
  }),

  CREATE: z.object({
    username: z.optional(z.string()).check(z.describe('Username for the new user')),
    email: z.optional(z.string()).check(z.describe('Email address for the new user')),
    password: z.optional(z.string()).check(z.describe('Password for the new user')),
    profile: z.optional(UserProfileSchema).check(z.describe('User profile information')),
  }),

  UPDATE: z.object({
    userId: z.string().check(z.describe('User ID to update')),
    profile: z.optional(UserProfileSchema).check(z.describe('Profile updates')),
    meta: z.optional(z.any()).check(z.describe('Additional metadata')),
  }),

  REMOVE: z.object({
    userId: z.string().check(z.describe('User ID to remove')),
    removeUserReviews: z._default(z.boolean(), false).check(z.describe('Also remove user reviews')),
  }),

  ENROLL: z.object({
    email: z.string().check(z.describe('Email address for enrollment')),
    profile: UserProfileSchema.check(z.describe('Profile information for new user')),
    password: z
      .optional(z.string())
      .check(z.describe('Optional password (if not provided, enrollment email sent)')),
  }),

  SET_TAGS: z.object({
    userId: z.string().check(z.describe('User ID to update')),
    tags: z.array(z.string()).check(z.describe('Array of tags to assign')),
  }),

  SET_USERNAME: z.object({
    userId: z.string().check(z.describe('User ID to update')),
    username: z.string().check(z.describe('New username to set')),
  }),

  ADD_EMAIL: z.object({
    userId: z.optional(z.string()).check(z.describe('User ID (optional, defaults to current user)')),
    email: z.string().check(z.describe('Email address to add')),
  }),

  REMOVE_EMAIL: z.object({
    userId: z.optional(z.string()).check(z.describe('User ID (optional, defaults to current user)')),
    email: z.string().check(z.describe('Email address to remove')),
  }),

  SEND_ENROLLMENT_EMAIL: z.object({
    email: z.string().check(z.describe('Email address to send enrollment to')),
  }),

  SEND_VERIFICATION_EMAIL: z.object({
    email: z.optional(z.string()).check(z.describe('Email address to verify (optional)')),
  }),

  REMOVE_PRODUCT_REVIEWS: z.object({
    userId: z.string().check(z.describe('User ID whose reviews to remove')),
  }),

  GET_ORDERS: z.object({
    userId: z.string().check(z.describe('User ID to get orders for')),
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    includeCarts: z._default(z.boolean(), false).check(z.describe('Include cart orders')),
    status: z.optional(z.array(z.string())).check(z.describe('Filter by order status')),
  }),

  GET_ENROLLMENTS: z.object({
    userId: z.string().check(z.describe('User ID to get enrollments for')),
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    status: z.optional(z.array(z.string())).check(z.describe('Filter by enrollment status')),
  }),

  GET_QUOTATIONS: z.object({
    userId: z.string().check(z.describe('User ID to get quotations for')),
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
  }),

  GET_BOOKMARKS: z.object({
    userId: z.string().check(z.describe('User ID to get bookmarks for')),
  }),
  GET_CURRENT_USER: z.object({}),

  GET_PAYMENT_CREDENTIALS: z.object({
    userId: z.string().check(z.describe('User ID to get payment credentials for')),
  }),

  GET_AVATAR: z.object({
    userId: z.string().check(z.describe('User ID to get avatar for')),
  }),

  GET_REVIEWS: z.object({
    userId: z.string().check(z.describe('User ID to get reviews for')),
    ...PaginationSchema,
    ...SortingSchema,
  }),

  GET_REVIEWS_COUNT: z.object({
    userId: z.string().check(z.describe('User ID to count reviews for')),
  }),
} as const;

export const UsersManagementSchema = createManagementSchemaFromValidators(actionValidators);

export type { ManagementParams as UsersManagementParams } from '../../utils/sharedSchemas.ts';

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (usersModule: any, params: Params<T>) => Promise<unknown>;
