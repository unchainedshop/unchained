import { HDKey } from '@scure/bip32';
import { NETWORK, p2wpkh, TEST_NETWORK } from '@scure/btc-signer';

const resolveNetwork = (prefix) => {
  if (['x', 'y', 'z'].includes(prefix)) return NETWORK;
  return TEST_NETWORK;
};

export default (xpub, index) => {
  const prefix = xpub.slice(0, 1);
  if (prefix !== 'z' && prefix !== 'v')
    throw new Error('Cryptopay only supports native segwit (zpub/vpub) extended key format for BTC');

  const hardenedMaster = HDKey.fromExtendedKey(
    xpub,
    prefix === 'z'
      ? {
          public: 0x04b24746, // zpub public
          private: 0x04b2430c, // zpriv private
        }
      : {
          public: 0x045f1cf6,
          private: 0x045f18bc,
        },
  );
  hardenedMaster.wipePrivateData(); // Neuter

  const child = hardenedMaster.deriveChild(0).deriveChild(index);

  if (!child.publicKey) throw new Error('Cannot derive public key from extended public key');

  const network = resolveNetwork(prefix);
  const pubKey = p2wpkh(child.publicKey, network);

  return pubKey.address;
};
