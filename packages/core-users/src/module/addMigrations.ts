import { Migration, MigrationRepository } from '@unchainedshop/types/core';

import { UsersCollection } from '../db/UsersCollection';

export default function addMigrations(repository: MigrationRepository<Migration>) {
  repository?.register({
    id: 20220603115000,
    name: 'Copy user.profile.customFields to user.meta',
    up: async () => {
      const Users = await UsersCollection(repository.db);
      const users = await Users.find(
        { meta: { $exists: false }, 'profile.customFields': { $exists: true } },
        { projection: { _id: true, profile: true, meta: true } },
      ).toArray();

      await Promise.all(
        users.map(async (user) => {
          await Users.updateOne(
            {
              _id: user._id,
            },
            {
              $set: { meta: (user.profile as any).customFields },
            },
          );
        }),
      );
    },
  });
}
