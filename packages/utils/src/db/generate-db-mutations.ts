import SimpleSchema from 'simpl-schema';
import {
  Collection,
  ModuleMutations,
  ModuleCreateMutation,
  _ID,
  Update,
  TimestampFields,
} from '@unchainedshop/types/common';
import { checkId } from './check-id';
import { generateDbObjectId } from './generate-db-object-id';
import { generateDbFilterById } from './generate-db-filter-by-id';

export const generateDbMutations = <T extends TimestampFields & { _id?: _ID }>(
  collection: Collection<T>,
  schema: SimpleSchema,
  options?: {
    hasCreateOnly?: boolean;
    permanentlyDeleteByDefault?: boolean;
  },
): ModuleMutations<T> | ModuleCreateMutation<T> => {
  if (!collection) throw new Error('Collection is missing');
  if (!schema) throw new Error('Schema is missing');

  const { hasCreateOnly, permanentlyDeleteByDefault } = options || {
    hasCreateOnly: false,
    permanentlyDeleteByDefault: false,
  };

  const deletePermanently = async (_id) => {
    checkId(_id);
    const filter = generateDbFilterById<T>(_id);
    const result = await collection.deleteOne(filter);
    return result.deletedCount;
  };

  return {
    create: async (doc, userId) => {
      const values = schema.clean(doc);
      values.created = new Date();
      values.createdBy = userId;
      schema.validate(values);
      values._id = doc._id || generateDbObjectId();

      const result = await collection.insertOne(values);
      return result.insertedId as string;
    },

    update: hasCreateOnly
      ? undefined
      : async (_id, doc, userId) => {
          checkId(_id);

          let modifier: Update<T>;

          if ((doc as Update<T>)?.$set) {
            const values = schema.clean(doc, { isModifier: true });
            modifier = {
              ...values,
              $set: {
                ...(values.$set || {}),
                updated: new Date(),
                updatedBy: userId,
              },
            };
          } else {
            const values = schema.clean(doc);
            modifier = {
              $set: {
                ...values,
                updated: new Date(),
                updatedBy: userId,
              },
            };
          }

          schema.validate(modifier, { modifier: true });
          const filter = generateDbFilterById<T>(_id, { deleted: null });
          await collection.updateOne(filter, modifier);

          return _id;
        },

    deletePermanently: hasCreateOnly ? undefined : deletePermanently,

    delete: hasCreateOnly
      ? undefined
      : async (_id, userId) => {
          if (permanentlyDeleteByDefault) {
            return deletePermanently(_id);
          }
          checkId(_id);
          const filter = generateDbFilterById<T>(_id, { deleted: null });
          const modifier = { $set: { deleted: new Date(), deletedBy: userId } };
          const values = schema.clean(modifier, { isModifier: true });
          const result = await collection.updateOne(filter, values);

          return result.modifiedCount;
        },
  };
};
