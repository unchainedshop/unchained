import SimpleSchema from 'simpl-schema';
import {
  Collection,
  ModuleMutations,
  ModuleCreateMutation,
  _ID,
} from '@unchainedshop/types/common';
import { checkId } from './check-id';
import { generateDbFilterById } from './generate-db-filter-by-id';

export const generateDbMutations = <T extends { _id?: _ID }>(
  collection: Collection<T>,
  schema: SimpleSchema,
  options?: {
    hasCreateOnly?: boolean;
  }
): ModuleMutations<T> | ModuleCreateMutation<T> => {
  if (!collection) throw new Error('Collection is missing');
  if (!schema) throw new Error('Schema is missing');

  const { hasCreateOnly } = options || { hasCreateOnly: false };
  return {
    create: async (doc, userId) => {
      const values = schema.clean(doc);
      values.created = new Date();
      values.createdBy = userId;
      schema.validate(values);
      const result = await collection.insertOne(values);

      return typeof result.insertedId === 'string'
        ? result.insertedId
        : result.insertedId.toHexString();
    },

    update: hasCreateOnly
      ? undefined
      : async (_id, doc, userId) => {
          checkId(_id);
          const values = schema.clean(doc, { isModifier: true });
          values.$set = values.$set || {};
          values.$set.updated = new Date();
          values.$set.updatedBy = userId;

          schema.validate(values, { modifier: true });
          const filter = generateDbFilterById(_id, { deleted: null });
          const result = await collection.updateOne(filter, values);

          return result.upsertedId.toHexString();
        },

    delete: hasCreateOnly
      ? undefined
      : async (_id, userId) => {
          checkId(_id);
          const filter = generateDbFilterById(_id, { deleted: null });
          const values = schema.clean(
            { deleted: new Date(), deletedBy: userId },
            { isModifier: true }
          );
          const result = await collection.updateOne(filter, values);

          return result.modifiedCount;
        },
  };
};
