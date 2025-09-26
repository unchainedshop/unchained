import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { TimestampFields } from '@unchainedshop/mongodb';

export type File = {
  _id: string;
  expires?: Date;
  path: string;
  meta?: Record<string, unknown>;
  name: string;
  size?: number;
  type?: string;
  url?: string;
} & TimestampFields;

export type SignedFileUpload = File & {
  putURL: string;
};
export const MediaObjectsCollection = async (db: mongodb.Db) => {
  const MediaObjects = db.collection<File>('media_objects');

  await buildDbIndexes<File>(MediaObjects, [
    { index: { expires: 1 }, options: { expireAfterSeconds: 0 } },
    { index: { created: -1 } },
  ]);

  return MediaObjects;
};
