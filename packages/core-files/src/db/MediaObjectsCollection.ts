import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { File } from '@unchainedshop/types/files.js';

export const MediaObjectsCollection = async (db: mongodb.Db) => {
  const MediaObjects = db.collection<File>('media_objects');

  await buildDbIndexes<File>(MediaObjects, [
    { index: { expires: 1 }, options: { expireAfterSeconds: 0 } },
    { index: { created: -1 } },
  ]);

  return MediaObjects;
};
