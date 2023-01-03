import order from './order.js';
import delivery from './delivery.js';
import discount from './discount.js';
import item from './item.js';
import payment from './payment.js';
import pickupLocation from './pick-up-location.js';

export default [...order, ...item, ...discount, ...delivery, ...payment, ...pickupLocation];
