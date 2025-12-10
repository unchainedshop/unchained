import order from './order.ts';
import delivery from './delivery.ts';
import discount from './discount.ts';
import item from './item.ts';
import payment from './payment.ts';
import pickupLocation from './pick-up-location.ts';

export default [...order, ...item, ...discount, ...delivery, ...payment, ...pickupLocation];
