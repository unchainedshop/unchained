
export interface DiscountCodeHandlers {
  generate: (amount: number) => Promise<string>;
  verify: (code: string) => Promise<number | null>;
}

const defaultDiscountCodeSecret =
  '0000000000000000000000000000000000000000000000000000000000000000';

async function siphash24Digest(payload: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key as ArrayBufferView<ArrayBuffer>,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, payload as ArrayBufferView<ArrayBuffer>);
  return new Uint8Array(signature).slice(0, 8);
}

function toBase58(buffer: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const byte of buffer) {
    num = num * 256n + BigInt(byte);
  }
  if (num === 0n) return ALPHABET[0];
  let result = '';
  while (num > 0n) {
    result = ALPHABET[Number(num % 58n)] + result;
    num = num / 58n;
  }
  return result;
}

function fromBase58(str: string): Uint8Array {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const char of str) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) throw new Error(`Invalid base58 character: ${char}`);
    num = num * 58n + BigInt(index);
  }
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 0xffn));
    num = num >> 8n;
  }
  return new Uint8Array(bytes);
}

export function createDefaultDiscountCodeHandlers(): DiscountCodeHandlers {
  const secret = process.env.DISCOUNT_CODE_SECRET || defaultDiscountCodeSecret;
  const keyBytes = new Uint8Array(secret.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

  const generate = async (priceAmount: number): Promise<string> => {
    const salt = crypto.getRandomValues(new Uint16Array(1))[0];
    const priceCents = Math.floor(priceAmount / 100);
    const uint16Array = new Uint16Array([priceCents, salt]);
    const payloadBuffer = new Uint8Array(
      uint16Array.buffer,
      uint16Array.byteOffset,
      uint16Array.byteLength,
    );

    const hash = await siphash24Digest(payloadBuffer, keyBytes);
    const signature = toBase58(hash);
    const payload = toBase58(payloadBuffer);

    return signature.replace(/(.{4})(.{4})(.*)/, `${payload}-$1-$2-$3`);
  };

  const verify = async (dashedSignature: string): Promise<number | null> => {
    try {
      const [payload] = dashedSignature.split('-');
      const payloadBytes = fromBase58(payload);
      // Ensure we have exactly 4 bytes for two uint16 values
      const padded = new Uint8Array(4);
      padded.set(payloadBytes.slice(0, 4));
      const uint16Array = new Uint16Array(padded.buffer);

      const priceCents = uint16Array[0];
      const salt = uint16Array[1];

      const priceAmount = Math.floor(priceCents * 100);
      const correctSignature = await generate(priceAmount);

      // Need to regenerate with same salt for comparison
      const saltedUint16 = new Uint16Array([priceCents, salt]);
      const saltedPayload = new Uint8Array(
        saltedUint16.buffer,
        saltedUint16.byteOffset,
        saltedUint16.byteLength,
      );
      const hash = await siphash24Digest(saltedPayload, keyBytes);
      const sig = toBase58(hash);
      const pay = toBase58(saltedPayload);
      const expected = sig.replace(/(.{4})(.{4})(.*)/, `${pay}-$1-$2-$3`);

      if (expected === dashedSignature) {
        return priceAmount;
      }
    } catch {
      /* invalid code */
    }
    return null;
  };

  return { generate, verify };
}
