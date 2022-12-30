import { Db } from '@unchainedshop/types/common.js';
import { File } from '@unchainedshop/types/files';
import { buildDbIndexes } from '@unchainedshop/utils';

export const MediaObjectsCollection = async (db: Db) => {
  const MediaObjects = db.collection<File>('media_objects');

  await buildDbIndexes<File>(MediaObjects, [
    { index: { expires: 1 }, options: { expireAfterSeconds: 0 } },
    { index: { created: -1 } },
  ]);

  return MediaObjects;
};
