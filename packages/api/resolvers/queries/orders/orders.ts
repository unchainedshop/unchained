import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';

export default async function orders(
  root: Root,
  params: {
    limit: number;
    offset: number;
    includeCarts: boolean;
    queryString?: string;
  },
  { modules, userId }: Context
) {
  const { includeCarts, limit, offset, queryString } = params;

  log(`query orders: ${limit} ${offset} ${includeCarts} ${queryString}`, {
    userId,
  });

  return modules.orders.findOrders({
    includeCarts,
    limit,
    offset,
    queryString,
  });
}
