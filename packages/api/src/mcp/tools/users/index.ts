import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { usersManagement, UsersManagementSchema } from './usersManagement.js';

export const registerUsersTools = (server: McpServer, context: Context) => {
  server.tool(
    'users_management',
    'Comprehensive user management system for Unchained e-commerce platform. Core operations: LIST (paginated user listing with filters for guests, email verification, last login dates), COUNT (user count with same filters), GET (retrieve user by ID), CREATE (new user with optional profile), UPDATE (profile/metadata updates), REMOVE (soft delete with optional review cleanup), ENROLL (create user + send enrollment email). User administration: SET_ROLES (assign admin/editor roles), SET_TAGS (categorization tags), SET_PASSWORD (admin password reset), SET_USERNAME (username changes). Email management: ADD_EMAIL/REMOVE_EMAIL (multi-email support), SEND_ENROLLMENT_EMAIL (trigger enrollment), SEND_VERIFICATION_EMAIL (email verification). Data access: GET_ORDERS (user order history with cart inclusion), GET_ENROLLMENTS (subscription enrollments), GET_QUOTATIONS (price quotes), GET_BOOKMARKS (saved products), GET_CART (active user cart), GET_PAYMENT_CREDENTIALS (stored payment methods), GET_AVATAR (profile image), GET_REVIEWS/GET_REVIEWS_COUNT (product reviews), REMOVE_PRODUCT_REVIEWS (bulk review cleanup), GET_CURRENT_USER (current session logged in user). Supports pagination, sorting, filtering, date ranges, and proper validation for all operations.',
    UsersManagementSchema,
    async (params) => usersManagement(context, params),
  );
};
