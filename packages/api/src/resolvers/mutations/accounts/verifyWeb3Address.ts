import { log } from '@unchainedshop/logger';
import { UserWeb3AddressNotFoundError, UserWeb3AddressSignatureError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

import type { keccak_256 as Keccak256Type } from '@noble/hashes/sha3.js';
import type { bytesToHex as BytesToHex, hexToBytes as HexToBytes } from '@noble/hashes/utils.js';
import type { secp256k1 as Secp256k1Type } from '@noble/curves/secp256k1.js';

// Dynamic imports for optional peer dependencies
let secp256k1: typeof Secp256k1Type;
let keccak_256: typeof Keccak256Type;
let bytesToHex: typeof BytesToHex;
let hexToBytes: typeof HexToBytes;

async function loadNoblePackages() {
  try {
    // eslint-disable-next-line
    // @ts-ignore
    const curves = await import('@noble/curves/secp256k1.js');

    // eslint-disable-next-line
    // @ts-ignore
    const hashes = await import('@noble/hashes/sha3.js');

    // eslint-disable-next-line
    // @ts-ignore
    const utils = await import('@noble/hashes/utils.js');

    if (!curves || !hashes || !utils) {
      throw new Error('Missing required @noble packages for Web3 signature verification');
    }

    secp256k1 = curves.secp256k1;
    keccak_256 = hashes.keccak_256;
    bytesToHex = utils.bytesToHex;
    hexToBytes = utils.hexToBytes;

    return true;
  } catch (error) {
    log('Failed to load @noble packages for Web3 verification', { error: error.message });
    return false;
  }
}

// Inline utility functions to replace @ethereumjs/util
function fromRPCSig(sig: string): { v: bigint; r: Uint8Array; s: Uint8Array } {
  const bytes = hexToBytes(sig.startsWith('0x') ? sig.slice(2) : sig);
  if (bytes.length !== 65) throw new Error('Invalid signature length');

  const r = bytes.slice(0, 32);
  const s = bytes.slice(32, 64);
  let v = BigInt(bytes[64]);

  // Handle EIP-155 encoding
  if (v >= 35n) {
    v = v - 35n - 2n * 1n; // chainId = 1 for mainnet, adjust if needed
  } else if (v >= 27n) {
    v = v - 27n;
  }

  return { v, r, s };
}

function hashPersonalMessage(message: Uint8Array): Uint8Array {
  const prefix = new TextEncoder().encode('\x19Ethereum Signed Message:\n');
  const lengthBytes = new TextEncoder().encode(message.length.toString());
  const combined = new Uint8Array(prefix.length + lengthBytes.length + message.length);
  combined.set(prefix, 0);
  combined.set(lengthBytes, prefix.length);
  combined.set(message, prefix.length + lengthBytes.length);
  return keccak_256(combined);
}

function ecrecover(msgHash: Uint8Array, v: bigint, r: Uint8Array, s: Uint8Array): Uint8Array {
  const recovery = Number(v);
  const signature = new Uint8Array(64);
  signature.set(r, 0);
  signature.set(s, 32);

  const publicKey = secp256k1.Signature.fromBytes(signature)
    .addRecoveryBit(recovery)
    .recoverPublicKey(msgHash);

  return publicKey.toBytes(false).slice(1); // Remove the 0x04 prefix for uncompressed key
}

function publicToAddress(publicKey: Uint8Array): Uint8Array {
  const hash = keccak_256(publicKey);
  return hash.slice(-20); // Take last 20 bytes
}

export default async function verifyWeb3Address(
  root: never,
  { address, hash }: { address: string; hash: `0x${string}` },
  { modules, userId, user }: Context,
) {
  log(`mutation verifyWeb3Address ${address} ${user?.username}`, {
    userId,
  });

  // Load noble packages dynamically
  const packagesLoaded = await loadNoblePackages();
  if (!packagesLoaded) {
    throw new Error(
      'Web3 signature verification is not available. Please install the required @noble packages: @noble/curves, @noble/hashes',
    );
  }

  const foundCredentials = modules.users.findWeb3Address(user!, address);
  if (!foundCredentials) {
    throw new UserWeb3AddressNotFoundError({ userId, address });
  }

  if (!foundCredentials.nonce) {
    throw new UserWeb3AddressSignatureError({ userId, address: foundCredentials.address });
  }

  // eslint-disable-next-line
  // @ts-ignore
  const messageHash = hashPersonalMessage(
    hexToBytes(Buffer.from(foundCredentials.nonce, 'utf8').toString('hex')),
  );

  const sigParams = fromRPCSig(hash);
  const publicKey = ecrecover(messageHash, sigParams.v, sigParams.r, sigParams.s);

  const sender = publicToAddress(publicKey);
  const recoveredAddr = `0x${bytesToHex(sender)}`;

  const isSignatureCorrectForAddress =
    recoveredAddr.toLowerCase() === foundCredentials.address.toLowerCase();

  if (!isSignatureCorrectForAddress) {
    throw new UserWeb3AddressSignatureError({ userId, address: foundCredentials.address });
  }

  return modules.users.verifyWeb3Address(userId!, address);
}
