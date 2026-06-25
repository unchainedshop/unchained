import type { MigrationRepository } from '@unchainedshop/mongodb';
import { normalizePhoneNumber } from '@unchainedshop/utils';
import { EnrollmentsCollection } from '../db/EnrollmentsCollection.ts';

export default function normalizeContactPhone(repository: MigrationRepository) {
  repository?.register({
    id: 20260625120100,
    name: 'Normalize enrollment.contact.telNumber to E.164 format',
    up: async ({ logger }) => {
      const Enrollments = await EnrollmentsCollection(repository.db);

      const enrollments = await Enrollments.find(
        { 'contact.telNumber': { $exists: true, $nin: [null, ''] } },
        { projection: { _id: true, contact: true, billingAddress: true, countryCode: true } },
      ).toArray();

      let changed = 0;
      let skipped = 0;
      for (const enrollment of enrollments) {
        const current = enrollment.contact?.telNumber;
        const defaultCountry = enrollment.billingAddress?.countryCode || enrollment.countryCode;
        const normalized = normalizePhoneNumber(current, defaultCountry);
        if (!normalized || normalized === current) {
          if (!normalized) skipped += 1;
          continue;
        }
        await Enrollments.updateOne(
          { _id: enrollment._id },
          { $set: { 'contact.telNumber': normalized } },
        );
        changed += 1;
      }

      logger?.info(
        `Normalize enrollment.contact.telNumber: ${changed} updated, ${skipped} left unchanged (unparseable)`,
      );
    },
  });
}
