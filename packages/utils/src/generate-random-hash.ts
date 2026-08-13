import Hashids from 'hashids';

const hashids = new Hashids('unchained', 6, 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789');

const RANGE = 999999998;
// Largest multiple of RANGE that fits in a Uint32 (2^32). Values at or above this
// fall in the final, partial block and are rejected so that reducing modulo RANGE
// stays uniform (rejection sampling — avoids the modulo bias of a plain `% RANGE`).
const REJECTION_LIMIT = Math.floor(0x100000000 / RANGE) * RANGE;

export default () => {
  // Use a cryptographically secure random number instead of Math.random(), and
  // reject the biased tail so every value in [1, RANGE] is equally likely.
  let value = crypto.getRandomValues(new Uint32Array(1))[0];
  while (value >= REJECTION_LIMIT) {
    value = crypto.getRandomValues(new Uint32Array(1))[0];
  }
  const randomNumber = (value % RANGE) + 1;
  return hashids.encode(randomNumber);
};
