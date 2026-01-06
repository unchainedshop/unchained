import { useCallback } from 'react';
import { useCSVExport } from '../../common/hooks/useCSVExport';


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
    'deleted',
    'meta',
    'configuration',
  ],
};
export const useUserExport = () => {
  const { exportCSV, isExporting } = useCSVExport();

  const exportUser = useCallback(
    async (data: Record<string, unknown>) => {
      await exportCSV({ type: 'User', ...data });
    },
    [exportCSV],
  );

  return { exportUser, isExporting };
};
