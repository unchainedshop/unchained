import { migrateOrderCartsService, MigrateOrderCartsService } from './migrateOrderCartService.js';
import { nextUserCartService, NextUserCartService } from './nextUserCartService.js';

export interface OrderServices {
  migrateOrderCarts: MigrateOrderCartsService;
  nextUserCart: NextUserCartService;
}

export const orderServices: OrderServices = {
  migrateOrderCarts: migrateOrderCartsService,
  nextUserCart: nextUserCartService,
};
