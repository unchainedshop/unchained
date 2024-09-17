import SimpleSchema from 'simpl-schema';
import { ModuleCreateMutation, ModuleMutations } from '@unchainedshop/core';
import { Collection, UpdateFilter } from 'mongodb';
import { checkId } from './check-id.js';
import { generateDbObjectId } from './generate-db-object-id.js';
import { generateDbFilterById } from './generate-db-filter-by-id.js';
import type { TimestampFields } from './mongodb-index.js';

export const generateDbMutations = <T extends TimestampFields & { _id?: string }>(
  collection: Collection<T>,
  schema?: SimpleSchema,
  options?: {
    permanentlyDeleteByDefault?: boolean;
  },
): ModuleMutations<T> | ModuleCreateMutation<T> => {
  if (!collection) throw new Error('Collection is missing');

  const { permanentlyDeleteByDefault } = options || {
    permanentlyDeleteByDefault: false,
  };

  const deletePermanently = async (_id) => {
    checkId(_id);
    const filter = generateDbFilterById<T>(_id);
    const result = await collection.deleteOne(filter);
    return result.deletedCount;
  };

  return {
    create: async (doc) => {
      const values: any = schema ? schema.clean(doc) : doc;
      values.created = new Date();
      schema?.validate(values);
      values._id = doc._id || generateDbObjectId();

      const result = await collection.insertOne(values);
      return result.insertedId as string;
    },

    update: async (_id, doc) => {
      checkId(_id);

      let modifier: UpdateFilter<T>;

      if ((doc as UpdateFilter<T>)?.$set) {
        const values: any = schema ? schema.clean(doc as any, { isModifier: true }) : doc;
        modifier = {
          ...values,
          $set: {
            ...(values.$set || {}),
            updated: new Date(),
          },
        };
      } else {
        const values: any = schema ? schema.clean(doc as any) : doc;
        modifier = {
          $set: {
            ...values,
            updated: new Date(),
          },
        };
      }

      schema?.validate(modifier, { modifier: true });
      const filter = generateDbFilterById<T>(_id, { deleted: null });
      await collection.updateOne(filter, modifier);

      return _id;
    },

    deletePermanently: deletePermanently,

    delete: async (_id) => {
      if (permanentlyDeleteByDefault) {
        return deletePermanently(_id);
      }
      checkId(_id);
      const filter = generateDbFilterById<T>(_id, { deleted: null });
      const modifier = { $set: { deleted: new Date() } };
      const values = schema
        ? schema.clean(modifier, { isModifier: true })
        : (modifier as UpdateFilter<T>);
      const result = await collection.updateOne(filter, values);

      return result.modifiedCount;
    },
  };
};
