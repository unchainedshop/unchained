import { OrderServices } from '@unchainedshop/types/orders';
import { migrateOrderCartsService } from './migrateOrderCartService';
import { createUserCartService } from './createUserCartService';

export const orderServices: OrderServices = {
  migrateOrderCarts: migrateOrderCartsService,
  createUserCart: createUserCartService,
};
