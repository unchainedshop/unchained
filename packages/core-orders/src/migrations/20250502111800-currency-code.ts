import type { MigrationRepository } from '@unchainedshop/mongodb';
import { OrdersCollection } from '../orders-index.ts';

export default function renameCurrencyCode(repository: MigrationRepository) {
  repository?.register({
    id: 20250502111800,
    name: 'Rename order.currency to order.currencyCode',
    up: async () => {
      const Orders = await OrdersCollection(repository.db);
      await Orders.updateMany(
        {},
        {
          $rename: { currency: 'currencyCode' },
        },
      );
    },
  });
}
