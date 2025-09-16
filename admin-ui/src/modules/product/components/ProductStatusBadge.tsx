import React from 'react';
import { useIntl } from 'react-intl';
import Badge from '../../common/components/Badge';
type ProductStatusBadgeProps = {
  status: 'DRAFT' | 'ACTIVE' | 'DELETED';
};
const PRODUCT_STATUS = {
  DRAFT: 'yellow',
  ACTIVE: 'emerald',
  DELETED: 'amber',
  null: 'yellow',
  undefined: 'yellow',
};
export const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({
  status,
}) => {
  const { formatMessage } = useIntl();

  const statusMessages: Record<string, string> = {
    PENDING: formatMessage({ id: 'pending', defaultMessage: 'PENDING' }),
    CONFIRMED: formatMessage({ id: 'confirmed', defaultMessage: 'CONFIRMED' }),
    OPEN: formatMessage({ id: 'open', defaultMessage: 'OPEN' }),
    FULLFILLED: formatMessage({ id: 'fulfilled', defaultMessage: 'FULFILLED' }),
    REJECTED: formatMessage({ id: 'rejected', defaultMessage: 'REJECTED' }),
  };

  const getProductStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return formatMessage({ id: 'active', defaultMessage: 'Active' });
      case 'DRAFT':
        return formatMessage({ id: 'draft', defaultMessage: 'Draft' });
      case 'DELETED':
        return formatMessage({
          id: 'deleted',
          defaultMessage: 'Deleted',
        });
      default:
        return formatMessage({ id: 'draft', defaultMessage: 'Draft' });
    }
  };

  return (
    <Badge
      text={getProductStatusLabel(status)}
      color={PRODUCT_STATUS[status] || 'yellow'}
      square
      dotted
    />
  );
};
