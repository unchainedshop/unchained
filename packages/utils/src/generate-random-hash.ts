import { randomInt } from 'node:crypto';

// Alphabet excludes O, 0, and 1, and matches the characters historically used for
// order/quotation/enrollment numbers, so new ids are visually indistinguishable
// from existing ones.
const ALPHABET = 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789';

export default () => Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
