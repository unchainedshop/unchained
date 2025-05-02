import { MigrationRepository } from '@unchainedshop/mongodb';
import { QuotationsCollection } from '../quotations-index.js';

export default function renameCurrencyCode(repository: MigrationRepository) {
  repository?.register({
    id: 20250502113100,
    name: 'Rename quotation.currency to quotation.currencyCode',
    up: async () => {
      const Quotations = await QuotationsCollection(repository.db);
      await Quotations.updateMany(
        {},
        {
          $rename: { currency: 'currencyCode' },
        },
      );
    },
  });
}
