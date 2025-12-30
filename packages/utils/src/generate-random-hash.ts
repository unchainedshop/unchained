import Hashids from 'hashids';

const hashids = new Hashids('unchained', 6, 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789');

export default () => {
  // Use cryptographically secure random number instead of Math.random()
  const randomBytes = crypto.getRandomValues(new Uint32Array(1));
  const randomNumber = (randomBytes[0] % 999999998) + 1;
  return hashids.encode(randomNumber);
};
