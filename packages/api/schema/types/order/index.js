import order from './order';
import delivery from './delivery';
import discount from './discount';
import item from './item';
import payment from './payment';

export default [...order, ...item, ...discount, ...delivery, ...payment];
