import order from './order';
import delivery from './delivery';
import discount from './discount';
import item from './item';
import payment from './payment';
import pickupLocation from './pick-up-location';

export default [...order, ...item, ...discount, ...delivery, ...payment, ...pickupLocation];
