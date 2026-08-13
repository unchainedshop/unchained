import type { MigrationRepository } from '@unchainedshop/mongodb';
import { normalizePhoneNumber } from '@unchainedshop/utils';
import { OrdersCollection } from '../orders-index.ts';

export default function normalizeContactPhone(repository: MigrationRepository) {
  repository?.register({
    id: 20260625120000,
    name: 'Normalize order.contact.telNumber to E.164 format',
    up: async ({ logger }) => {
      const Orders = await OrdersCollection(repository.db);

      const orders = await Orders.find(
        { 'contact.telNumber': { $exists: true, $nin: [null, ''] } },
        { projection: { _id: true, contact: true, billingAddress: true, countryCode: true } },
      ).toArray();

      let changed = 0;
      let skipped = 0;
      for (const order of orders) {
        const current = order.contact?.telNumber;
        const defaultCountry = order.billingAddress?.countryCode || order.countryCode;
        const normalized = normalizePhoneNumber(current, defaultCountry);
        if (!normalized || normalized === current) {
          if (!normalized) skipped += 1;
          continue;
        }
        await Orders.updateOne({ _id: order._id }, { $set: { 'contact.telNumber': normalized } });
        changed += 1;
      }

      logger?.info(
        `Normalize order.contact.telNumber: ${changed} updated, ${skipped} left unchanged (unparseable)`,
      );
    },
  });
}
