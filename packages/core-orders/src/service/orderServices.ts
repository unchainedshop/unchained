import { OrderServices } from '@unchainedshop/types/orders.js';
import { migrateOrderCartsService } from './migrateOrderCartService.js';
import { nextUserCartService } from './nextUserCartService.js';

export const orderServices: OrderServices = {
  migrateOrderCarts: migrateOrderCartsService,
  nextUserCart: nextUserCartService,
};
