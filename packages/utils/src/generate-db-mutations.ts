import SimpleSchema from 'simpl-schema';
import { Collection, ModuleMutations, ObjectId } from 'unchained-core-types';
import { checkId } from './checkId';

export const generateDbMutations = <T extends {}>(
  collection: Collection<T>,
  schema: SimpleSchema
): ModuleMutations<T> => {
  if (!collection) throw 'Collection is missing';
  if (!schema) throw 'Schema is missing';
  return {
    create: async (doc, userId) => {
      const values = schema.clean(doc);
      values.created = new Date();
      values.createdBy = userId;
      schema.validate(values);
      const result = await collection.insertOne(values);
      return `${result}`;
    },
    update: async (_id, doc, userId) => {
      checkId(_id);
      const values = schema.clean(doc, { isModifier: true });
      values.$set = values.$set || {};
      values.$set.updated = new Date();
      values.$set.updatedBy = userId;

      schema.validate(values, { modifier: true });
      const filter = { _id: new ObjectId(_id) };
      await collection.updateOne(filter, values);
    },
    delete: async (_id) => {
      checkId(_id);
      const filter = { _id: new ObjectId(_id) };
      const result = await collection.deleteOne(filter);
      console.log('RESULT', result)
      return result.deletedCount
    },
  };
};
