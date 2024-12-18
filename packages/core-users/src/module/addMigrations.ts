import { MigrationRepository } from '@unchainedshop/mongodb';
import { UsersCollection } from '../db/UsersCollection.js';
import { systemLocale } from '@unchainedshop/utils';

export default function addMigrations(repository: MigrationRepository) {
  repository?.register({
    id: 20230719105000,
    name: 'Rename user.lastLogin.countryContext to user.lastLogin.countryCode',
    up: async () => {
      const Users = await UsersCollection(repository.db);
      await Users.updateMany(
        {
          'lastLogin.countryContext': { $exists: true },
        },
        {
          $rename: { 'lastLogin.countryContext': 'lastLogin.countryCode' },
        },
      );
    },
  });

  repository?.register({
    id: 20241218084300,
    name: 'Convert user.lastLogin.locale',
    up: async () => {
      const Users = await UsersCollection(repository.db);

      const users = await Users.find(
        {
          'lastLogin.locale': { $exists: true },
        },
        { projection: { _id: true, lastLogin: true } },
      ).toArray();

      for (const user of users) {
        let newLocale;
        try {
          newLocale = new Intl.Locale(user.lastLogin.locale);
        } catch {
          /* */
          try {
            newLocale = new Intl.Locale(user.lastLogin.locale.split('_').join('-'));
          } catch {
            /* */
            newLocale = systemLocale.baseName;
          }
        }

        await Users.updateOne(
          {
            _id: user._id,
          },
          {
            $set: { 'lastLogin.locale': newLocale },
          },
        );
      }
    },
  });
}
