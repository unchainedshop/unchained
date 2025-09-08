import { HDKey } from '@scure/bip32';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';

function getChecksumAddress(address) {
  const chars = address.split('');
  const expanded = new Uint8Array(40);
  for (let i = 0; i < 40; i++) {
    expanded[i] = chars[i].charCodeAt(0);
  }
  const hashed = keccak_256(expanded);

  for (let i = 0; i < 40; i += 2) {
    if (hashed[i >> 1] >> 4 >= 8) {
      chars[i] = chars[i].toUpperCase();
    }
    if ((hashed[i >> 1] & 0x0f) >= 8) {
      chars[i + 1] = chars[i + 1].toUpperCase();
    }
  }

  return '0x' + chars.join('');
}

export default (xpub, index) => {
  const hardenedMaster = HDKey.fromExtendedKey(xpub);
  hardenedMaster.wipePrivateData(); // Neuter

  const child = hardenedMaster.deriveChild(0).deriveChild(index);

  // ETH Address (secp256k1 + keccak_256 + checksum)
  const childSigningKey = secp256k1.Point.fromBytes(child.publicKey).toBytes(false);
  const address = Buffer.from(keccak_256(childSigningKey.slice(1)))
    .toString('hex')
    .substring(24);

  return getChecksumAddress(address);
};
