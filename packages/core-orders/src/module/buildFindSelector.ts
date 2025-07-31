import { OrderQuery, Order } from '../db/OrdersCollection.js';
import { assertDocumentDBCompatMode, mongodb } from '@unchainedshop/mongodb';

export const buildFindSelector = ({
  includeCarts,
  status,
  userId,
  queryString,
  paymentIds,
  deliveryIds,
  dateRange,
  ...rest
}: OrderQuery) => {
  const selector: mongodb.Filter<Order> = { ...rest };
  if (dateRange) console.log(dateRange);
  if (userId) {
    selector.userId = userId;
  }
  if (Array.isArray(deliveryIds) && deliveryIds?.length) {
    selector.deliveryId = { $in: deliveryIds };
  }

  if (Array.isArray(paymentIds) && paymentIds?.length) {
    selector.paymentId = { $in: paymentIds };
  }

  if (Array.isArray(status) && status?.length) {
    selector.status = { $in: status };
  } else if (!includeCarts) {
    selector.status = { $ne: null }; // TODO: Slow performance! IDXSCAN in common query!
  }
  if (queryString) {
    assertDocumentDBCompatMode();
    (selector as any).$text = { $search: queryString };
  }

  return selector;
};

export default buildFindSelector;
