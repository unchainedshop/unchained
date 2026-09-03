import type { McpServer } from '@modelcontextprotocol/server';
import type { Context } from '../../../context.ts';
import { usersManagement, UsersManagementSchema } from './usersManagement.ts';

export const registerUsersTools = (server: McpServer, context: Context) => {
  server.registerTool(
    'users_management',
    {
      description:
        'User management for Unchained e-commerce. Actions: LIST, COUNT, GET, CREATE, UPDATE, REMOVE, ENROLL (create + send enrollment email), SET_TAGS, SET_USERNAME, ADD_EMAIL, REMOVE_EMAIL, SEND_ENROLLMENT_EMAIL, SEND_VERIFICATION_EMAIL, GET_ORDERS, GET_ENROLLMENTS, GET_QUOTATIONS, GET_BOOKMARKS, GET_PAYMENT_CREDENTIALS, GET_AVATAR, GET_REVIEWS, GET_REVIEWS_COUNT, REMOVE_PRODUCT_REVIEWS, GET_CURRENT_USER. LIST supports pagination, sorting, search, and filters for guests, email verification, and last login; COUNT supports the same search and filter criteria.',
      inputSchema: UsersManagementSchema,
    },
    async (params) => usersManagement(context, params),
  );
};
