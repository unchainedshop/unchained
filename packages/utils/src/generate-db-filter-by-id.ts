import { Filter, _ID } from '@unchainedshop/types/common';
import { ObjectId } from 'bson';

export const generateDbFilterById = (id: unknown): Filter<{ _id?: _ID }> => {
  const _id =
    typeof id === 'string' && (id.length === 12 || id.length === 24)
      ? new ObjectId(id)
      : id as ObjectId;
  return { _id };
};
