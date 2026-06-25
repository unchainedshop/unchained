import type { MigrationRepository } from '@unchainedshop/mongodb';
import { normalizePhoneNumber } from '@unchainedshop/utils';
import { UsersCollection } from '../db/UsersCollection.ts';

export default function normalizeProfilePhone(repository: MigrationRepository) {
  repository?.register({
    id: 20260625120200,
    name: 'Normalize user.profile.phoneMobile and user.lastContact.telNumber to E.164 format',
    up: async ({ logger }) => {
      const Users = await UsersCollection(repository.db);

      const users = await Users.find(
        {
          $or: [
            { 'profile.phoneMobile': { $exists: true, $nin: [null, ''] } },
            { 'lastContact.telNumber': { $exists: true, $nin: [null, ''] } },
          ],
        },
        {
          projection: {
            _id: true,
            profile: true,
            lastContact: true,
            lastBillingAddress: true,
            lastLogin: true,
          },
        },
      ).toArray();

      let changed = 0;
      let skipped = 0;
      for (const user of users) {
        // Best-effort default country: users have no address on the phone field itself.
        const defaultCountry =
          user.lastBillingAddress?.countryCode ||
          user.profile?.address?.countryCode ||
          user.lastLogin?.countryCode;

        const $set: Record<string, string> = {};

        const phoneMobile = user.profile?.phoneMobile;
        const normalizedPhoneMobile = normalizePhoneNumber(phoneMobile, defaultCountry);
        if (normalizedPhoneMobile && normalizedPhoneMobile !== phoneMobile) {
          $set['profile.phoneMobile'] = normalizedPhoneMobile;
        }

        const telNumber = user.lastContact?.telNumber;
        const normalizedTelNumber = normalizePhoneNumber(telNumber, defaultCountry);
        if (normalizedTelNumber && normalizedTelNumber !== telNumber) {
          $set['lastContact.telNumber'] = normalizedTelNumber;
        }

        if (Object.keys($set).length === 0) {
          if ((phoneMobile && !normalizedPhoneMobile) || (telNumber && !normalizedTelNumber)) {
            skipped += 1;
          }
          continue;
        }

        await Users.updateOne({ _id: user._id }, { $set });
        changed += 1;
      }

      logger?.info(
        `Normalize user phone numbers: ${changed} updated, ${skipped} left unchanged (unparseable)`,
      );
    },
  });
}
