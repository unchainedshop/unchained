import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';

export default async function ordersCount(
  root: Root,
  { includeCarts }: { includeCarts: boolean },
  { modules, userId }: Context,
) {
  log(`query ordersCount: ${includeCarts ? 'includeCart' : ''}`, { userId });

  return modules.orders.count({ includeCarts });
}
