import order from './order';
import delivery from './delivery';
import discount from './discount';
import item from './item';
import payment from './payment';
import pickuplocation from './pick-up-location';

export default [
  ...order,
  ...item,
  ...discount,
  ...delivery,
  ...payment,
  ...pickuplocation
];
