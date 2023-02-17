import Hashids from 'hashids';

const hashids = new Hashids('unchained', 6, 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789');

export default () => {
  const randomNumber = Math.floor(Math.random() * (999999999 - 1)) + 1;
  return hashids.encode(randomNumber);
};
