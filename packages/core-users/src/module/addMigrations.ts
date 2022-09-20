import { Migration, MigrationRepository } from '@unchainedshop/types/core';

import { convertTagsToLowerCase } from '@unchainedshop/utils';
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

  repository?.register({
    id: 20220920122500,
    name: 'Convert user tags to lower case for easy search',
    up: async () => {
      const Users = await UsersCollection(repository.db);
      await convertTagsToLowerCase(Users);
    },
  });
}
