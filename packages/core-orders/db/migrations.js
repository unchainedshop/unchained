import runOrderDeliveryMigrations from './order-deliveries/schema';
import runOrderDiscountsMigrations from './order-discounts/schema';
import runOrderPaymentsMigrations from './order-payments/schema';
import runOrderPositionsMigrations from './order-positions/schema';
import runOrdersMigrations from './orders/schema';

export default () => {
  runOrderDeliveryMigrations();
  runOrderDiscountsMigrations();
  runOrderPaymentsMigrations();
  runOrderPositionsMigrations();
  runOrdersMigrations();
};
