import { OrderServices } from '@unchainedshop/types/orders.js';
import { migrateOrderCartsService } from './migrateOrderCartService.js';
import { nextUserCartService } from './nextUserCartService.js';
import { createUserCartService } from './createUserCartService.js';

export const orderServices: OrderServices = {
  migrateOrderCarts: migrateOrderCartsService,
  createUserCart: createUserCartService,
  removeUserTraces: removeUserTracesOrderService,
  nextUserCart: nextUserCartService,
};
