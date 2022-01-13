import { OrderServices } from '@unchainedshop/types/orders';
import { migrateOrderCartsService } from './migrateOrderCartService';

export const orderServices: OrderServices = {
  migrateOrderCarts: migrateOrderCartsService,
};
