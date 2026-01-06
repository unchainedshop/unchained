import type { UnchainedCore } from '../../core-index.ts';
import generateCSVFileAndURL from './generateCSVFileAndUrl.ts';
import { z } from 'zod';
import { EXPORTS_DIRECTORY } from '../createBulkExporter.ts';

export const UserExportPayloadSchema = z.object({
  exportReviews: z.boolean().optional(),
  exportOrders: z.boolean().optional(),
  exportBookmarks: z.boolean().optional(),
  exportEvents: z.boolean().optional(),
  exportQuotations: z.boolean().optional(),
  exportEnrollments: z.boolean().optional(),
  userId: z.string().optional(),
});

export interface UserExportParams {
  exportReviews?: boolean;
  exportOrders?: boolean;
  exportBookmarks?: boolean;
  exportEvents?: boolean;
  exportQuotations?: boolean;
  userId: string;
}

const USER_CSV_SCHEMA = {
  userFields: [
    '_id',
    'emailAddresses',
    'tags',
    'roles',
    'username',
    'created',
    'isGuest',
    'displayName',
    'birthday',
    'phoneMobile',
    'gender',
    'address.addressLine',
    'address.addressLine2',
    'address.city',
    'address.company',
    'address.countryCode',
    'address.firstName',
    'address.lastName',
    'address.postalCode',
    'address.regionCode',
    'meta',
    'lastBillingAddress',
    'lastContact',
    'lastLogin',
  ],
  bookmarkFields: ['_id', 'productId', 'userId'],
  orderFields: [
    '_id',
    'userId',
    'orderNumber',
    'status',
    'billingAddress',
    'contact',
    'countryCode',
    'currencyCode',
    'deliveryId',
    'paymentId',
    'confirmed',
    'ordered',
    'fulfilled',
  ],
  reviewFields: [
    '_id',
    'productId',
    'authorId',
    'rating',
    'title',
    'review',
    'vote.type',
    'vote.timestamp',
    'vote.meta',
    'meta',
  ],
  quotationFields: [
    '_id',
    'userId',
    'quotationNumber',
    'productId',
    'status',
    'price',
    'expires',
    'fulfilled',
    'rejected',
    'meta',
    'configuration',
  ],
};

const exportUsersHandler = async (
  { userId, ...options }: UserExportParams,
  _,
  unchainedAPI: UnchainedCore,
) => {
  const { modules } = unchainedAPI;
  const user = await modules.users.findUserById(userId);
  const userRows: Record<string, any>[] = [];
  const orderRows: Record<string, any>[] = [];
  const bookmarkRows: Record<string, any>[] = [];
  const quotationRows: Record<string, any>[] = [];
  const reviewRows: Record<string, any>[] = [];
  if (!user) throw new Error(`User with ID ${userId} not found`);

  userRows.push({
    _id: user._id,
    emailAddresses: user.emails ? user.emails.map((email: any) => email.address).join('; ') : '',
    created: new Date(user.created).getTime(),
    isGuest: user.guest || false,
    tags: user.tags ? user.tags.join('; ') : '',
    roles: user.roles ? user.roles.join('; ') : '',
    username: user.username || '',
    displayName: user.profile?.displayName || '',
    birthday: user.profile?.birthday ? new Date(user.profile?.birthday).getTime() : '',
    phoneMobile: user.profile?.phoneMobile || '',
    gender: user.profile?.gender || '',
    'address.addressLine': user.profile?.address?.addressLine || '',
    'address.addressLine2': user.profile?.address?.addressLine2 || '',
    'address.city': user.profile?.address?.city || '',
    'address.company': user.profile?.address?.company || '',
    'address.countryCode': user.profile?.address?.countryCode || '',
    'address.firstName': user.profile?.address?.firstName || '',
    'address.lastName': user.profile?.address?.lastName || '',
    'address.postalCode': user.profile?.address?.postalCode || '',
    'address.regionCode': user.profile?.address?.regionCode || '',
    meta: user.meta ? JSON.stringify(user.meta) : '',
    lastBillingAddress: user.lastBillingAddress ? JSON.stringify(user.lastBillingAddress) : '',
    lastContact: user.lastContact ? JSON.stringify(user.lastContact) : '',
    lastLogin: user.lastLogin ? JSON.stringify(user.lastLogin) : '',
  });

  if (options.exportBookmarks) {
    const bookmarks = await modules.bookmarks.findBookmarksByUserId(userId);
    for (const bookmark of bookmarks) {
      const row: Record<string, any> = {};
      USER_CSV_SCHEMA.bookmarkFields.forEach((field) => {
        row[field] = bookmark[field] || '';
      });
      bookmarkRows.push(row);
    }
  }
  if (options.exportOrders) {
    const orders = await modules.orders.findOrders({ userId });
    for (const order of orders) {
      const row: Record<string, any> = {};
      USER_CSV_SCHEMA.orderFields.forEach((field) => {
        if ((field === 'ordered' || field === 'confirmed' || field === 'fulfilled') && order[field]) {
          row[field] = new Date(order[field]).getTime();
        } else if (field === 'billingAddress' && order.billingAddress) {
          row[field] = JSON.stringify(order.billingAddress);
        } else if (field === 'contact' && order.contact) {
          row[field] = JSON.stringify(order.contact);
        } else {
          row[field] = order[field] || '';
        }
      });
      orderRows.push(row);
    }
  }

  if (options.exportReviews) {
    const reviews = await modules.products.reviews.findProductReviews({
      authorId: userId,
    });
    for (const review of reviews) {
      const row: Record<string, any> = {};
      USER_CSV_SCHEMA.reviewFields.forEach((field) => {
        if (field.startsWith('vote.')) {
          const voteField = field.split('.')[1];
          if (voteField === 'timestamp' && review.votes[0][voteField]) {
            row[field] = new Date(review.votes[0][voteField]).getTime();
          } else if (voteField === 'meta' && review.votes[0][voteField]) {
            row[field] = JSON.stringify(review.votes[0][voteField]);
          } else {
            row[field] = review.votes[0][voteField] || '';
          }
        } else {
          if (field === 'meta' && review.meta) {
            row[field] = JSON.stringify(review.meta);
            return;
          } else {
            row[field] = review[field] || '';
          }
        }
      });
      reviewRows.push(row);
    }
    if (options.exportQuotations) {
      const quotations = await modules.quotations.findQuotations({
        userId,
      });
      for (const quotation of quotations) {
        const row: Record<string, any> = {};
        USER_CSV_SCHEMA.quotationFields.forEach((field) => {
          if (field === 'configuration' && quotation.configuration) {
            row[field] = JSON.stringify(quotation.configuration);
          } else if (field === 'meta' && quotation.meta) {
            row[field] = JSON.stringify(quotation.meta);
          } else {
            row[field] = quotation[field] || '';
          }
        });
        quotationRows.push(row);
      }
    }

    const userCSV = await generateCSVFileAndURL({
      headers: USER_CSV_SCHEMA.userFields,
      rows: userRows,
      directoryName: EXPORTS_DIRECTORY,
      fileName: 'user_export.csv',
      unchainedAPI,
    });

    const reviewCSV = options.exportReviews
      ? await generateCSVFileAndURL({
          headers: USER_CSV_SCHEMA.reviewFields,
          rows: reviewRows,
          directoryName: EXPORTS_DIRECTORY,
          fileName: 'user_reviews_export.csv',
          unchainedAPI,
        })
      : null;

    const quotationCSV = options.exportQuotations
      ? await generateCSVFileAndURL({
          headers: USER_CSV_SCHEMA.quotationFields,
          rows: quotationRows,
          directoryName: EXPORTS_DIRECTORY,
          fileName: 'user_quotations_export.csv',
          unchainedAPI,
        })
      : null;

    const bookmarksCSV = options.exportBookmarks
      ? await generateCSVFileAndURL({
          headers: USER_CSV_SCHEMA.bookmarkFields,
          rows: bookmarkRows,
          directoryName: EXPORTS_DIRECTORY,
          fileName: 'user_bookmarks_export.csv',
          unchainedAPI,
        })
      : null;
    const ordersCSV = options.exportOrders
      ? await generateCSVFileAndURL({
          headers: USER_CSV_SCHEMA.orderFields,
          rows: orderRows,
          directoryName: EXPORTS_DIRECTORY,
          fileName: 'user_orders_export.csv',
          unchainedAPI,
        })
      : null;

    return {
      user: userCSV,
      bookmarks: bookmarksCSV,
      orders: ordersCSV,
      reviews: reviewCSV,
      quotations: quotationCSV,
    };
  }
};

export default exportUsersHandler;

exportUsersHandler.payloadSchema = UserExportPayloadSchema;
