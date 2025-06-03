import { describe, it } from 'node:test';
import assert from 'node:assert';
import deriveBtcAddress from './derive-btc-address.js';

describe('BTC Address Derivation', () => {
  it('returns a deterministic BIP44 child address', () => {
    assert.equal(
      deriveBtcAddress(
        'zpub6qpRm6gMdkrXvVKw7qgayHnqJGJkpE4rnYQdyJfZW87ed4Fk6HjVaThN12hv2rrL3EzfvvBW6ZpbMEe5UxZYEjhgeMigyvAbS5LiXPkKrys',
        1,
      ),
      'bc1qspcam3ntdpvhgz4vnxfdhas6qr8hf8tjfaz5p4',
    );
    assert.equal(
      deriveBtcAddress(
        'zpub6qpRm6gMdkrXvVKw7qgayHnqJGJkpE4rnYQdyJfZW87ed4Fk6HjVaThN12hv2rrL3EzfvvBW6ZpbMEe5UxZYEjhgeMigyvAbS5LiXPkKrys',
        2,
      ),
      'bc1qd0a7znq3pz3sc4armthddkyam57ey7qjc4v6vn',
    );
  });
});
