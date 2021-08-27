import Hashids from 'hashids/cjs';

const hashids = new Hashids(
  'unchained',
  6,
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
);

export default () => {
  const randomNumber = Math.floor(Math.random() * (999999999 - 1)) + 1;
  return hashids.encode(randomNumber);
};
