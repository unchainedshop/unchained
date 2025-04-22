import { MigrationRepository } from '@unchainedshop/mongodb';
import { UsersCollection } from '../db/UsersCollection.js';
import { systemLocale } from '@unchainedshop/utils';

export default function addMigrations(repository: MigrationRepository) {
  repository?.register({
    id: 20230719105000,
    name: 'Rename user.lastLogin.countryCode to user.lastLogin.countryCode',
    up: async () => {
      const Users = await UsersCollection(repository.db);
      await Users.updateMany(
        {
          'lastLogin.countryCode': { $exists: true },
        },
        {
          $rename: { 'lastLogin.countryCode': 'lastLogin.countryCode' },
        },
      );
    },
  });

  repository?.register({
    id: 20241218092300,
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
          newLocale = new Intl.Locale(user.lastLogin.locale).baseName;
        } catch {
          /* */
          try {
            newLocale = new Intl.Locale(user.lastLogin.locale.split('_').join('-')).baseName;
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
