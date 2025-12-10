import { describe, it } from 'node:test';
import assert from 'node:assert';
import deriveEthAddress from './derive-eth-address.ts';

describe('ETH Address Derivation', () => {
  it('returns a deterministic BIP44 child address', () => {
    assert.equal(
      deriveEthAddress(
        'xpub6DTksA6DsGUgbEp1U29v3qGTt5P99iKThaqGEzerTfD73ZAg1F8j15TxWTPEjjA1uw1Zmwwc5dgVCXwTL2ZNhvdoLWNdqVuL1MDJMsQCLLs',
        1,
      ),
      '0x11CF7d607A1Dc45a002592891fF25DAAE6eC7dE9',
    );
    assert.equal(
      deriveEthAddress(
        'xpub6DTksA6DsGUgbEp1U29v3qGTt5P99iKThaqGEzerTfD73ZAg1F8j15TxWTPEjjA1uw1Zmwwc5dgVCXwTL2ZNhvdoLWNdqVuL1MDJMsQCLLs',
        2,
      ),
      '0x61663D505e3aB5b61a5344eA2c64b644c08013ea',
    );
  });
});
