import type { MigrationRepository } from '@unchainedshop/mongodb';
import { UsersCollection } from '../db/UsersCollection.ts';
import { systemLocale } from '@unchainedshop/utils';

export default function convertUserLocale(repository: MigrationRepository) {
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
        const currentLocale = user.lastLogin?.locale;
        if (!currentLocale) continue;

        try {
          newLocale = new Intl.Locale(currentLocale).baseName;
        } catch {
          /* */
          try {
            newLocale = new Intl.Locale(currentLocale.split('_').join('-')).baseName;
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
