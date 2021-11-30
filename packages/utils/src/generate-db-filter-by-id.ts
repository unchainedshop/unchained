import type { Filter, _ID } from '@unchainedshop/types';
import { Query } from '@unchainedshop/types/common';
import { ObjectId } from 'bson';

export const generateDbFilterById = (id: unknown, query: Query | undefined = {}): Filter<{ _id?: _ID }> => {
  const _id =
    typeof id === 'string' && (id.length === 12 || id.length === 24)
      ? new ObjectId(id)
      : id;
  return { _id, ...query };
};
