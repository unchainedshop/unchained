import { Migration, MigrationRepository } from '@unchainedshop/types/core.js';
import { UsersCollection } from '../db/UsersCollection.js';

const convertTagsToLowerCase = async (collection: Awaited<ReturnType<typeof UsersCollection>>) => {
  let bulk = collection.initializeUnorderedBulkOp();
  let count = 0;

  const cursor = await collection.find({ tags: { $regex: '.*[A-Z]' } });
  // eslint-disable-next-line no-restricted-syntax
  for await (const doc of cursor) {
    const transformedTags = doc.tags.map((tag) => tag.toLowerCase());
    count += 1;
    bulk.find({ _id: doc._id }).updateOne({ $set: { tags: transformedTags } });
    if (count % 500 === 0) {
      bulk.execute();
      bulk = collection.initializeUnorderedBulkOp();
      count = 0;
    }
  }
  if (count > 0) bulk.execute();
};

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
}
