import { randomInt } from 'node:crypto';

// Unambiguous charset: no O/0, I/1 — matches the alphabet historically used for
// order/quotation/enrollment numbers, so new ids are visually indistinguishable
// from existing ones.
const ALPHABET = 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789';

export default () => Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
