import { Db } from '@unchainedshop/types/common';
import { File } from '@unchainedshop/types/files';
import { buildDbIndexes } from 'meteor/unchained:utils'

export const FilesCollection = async (db: Db) => {
  const Files = db.collection<File>('media_objects');

  await buildDbIndexes<File>(Files, [
    () => Files.createIndex({ expires: 1 }, { expireAfterSeconds: 0 }),
    () => Files.createIndex({ created: -1 }),
  ]);

  return Files;
};
