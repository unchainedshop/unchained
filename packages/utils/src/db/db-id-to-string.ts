import { _ID } from '@unchainedshop/types/common';
import { ObjectId } from 'bson';

export const dbIdToString = (_id: _ID): string => {
  const id = typeof _id === 'string' ? _id : (_id as ObjectId).toHexString();
  return id;
};
