import { buildDbIndexes, type mongodb } from '@unchainedshop/mongodb';

export interface UcpIdempotencyRecord {
  _id: string;
  bodyHash: string;
  response?: { status: number; body: string };
  created: Date;
}

export const UcpIdempotencyCollection = async (db: mongodb.Db) => {
  const UcpIdempotency = db.collection<UcpIdempotencyRecord>('ucp_idempotency');

  await buildDbIndexes<UcpIdempotencyRecord>(UcpIdempotency, [
    { index: { created: 1 }, options: { expireAfterSeconds: 48 * 60 * 60 } },
  ]);

  return UcpIdempotency;
};
