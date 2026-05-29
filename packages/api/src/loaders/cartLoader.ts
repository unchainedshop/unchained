import type { UnchainedCore } from '@unchainedshop/core';
import type { Order } from '@unchainedshop/core-orders';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ userId: string; countryCode?: string; orderNumber?: string }, Order | null>(
    async (queries) => {
      const userIds = [...new Set(queries.map((q) => q.userId).filter(Boolean))];

      const carts = await unchainedAPI.modules.orders.findCarts({ userIds });

      // findCarts returns carts sorted by `updated` descending, so the first
      // match per query key is the most recently updated cart, mirroring the
      // semantics of modules.orders.cart.
      return queries.map(
        (q) =>
          carts.find(
            (cart) =>
              cart.userId === q.userId &&
              (!q.countryCode || cart.countryCode === q.countryCode) &&
              (!q.orderNumber || cart.orderNumber === q.orderNumber),
          ) || null,
      );
    },
  );
