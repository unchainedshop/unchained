import type { mongodb } from '@unchainedshop/mongodb';
import { UcpIdempotencyCollection, type UcpIdempotencyRecord } from './db/UcpIdempotencyCollection.ts';

export const configureUcpModule = async ({ db }: { db: mongodb.Db }) => {
  const UcpIdempotency = await UcpIdempotencyCollection(db);

  return {
    idempotency: {
      begin: async (_id: string, bodyHash: string): Promise<UcpIdempotencyRecord | null> => {
        try {
          await UcpIdempotency.insertOne({ _id, bodyHash, created: new Date() });
          return null;
        } catch (error) {
          if (error.code !== 11000) throw error;
          return (await UcpIdempotency.findOne({ _id })) ?? { _id, bodyHash, created: new Date() };
        }
      },
      finish: async (_id: string, response: { status: number; body: string }) => {
        await UcpIdempotency.updateOne({ _id }, { $set: { response } });
      },
      release: async (_id: string) => {
        await UcpIdempotency.deleteOne({ _id, response: { $exists: false } });
      },
    },
  };
};

export interface UcpModule {
  ucp: Awaited<ReturnType<typeof configureUcpModule>>;
}
