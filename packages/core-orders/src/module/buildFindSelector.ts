import { OrderQuery, Order } from '../db/OrdersCollection.js';
import { assertDocumentDBCompatMode, mongodb } from '@unchainedshop/mongodb';

export const buildFindSelector = ({ includeCarts, status, userId, queryString }: OrderQuery) => {
  const selector: mongodb.Filter<Order> = {};

  if (userId) {
    selector.userId = userId;
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
