// https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2
const PBKDF2_ITERATIONS = 300000; // Iterations, > 210'000
const PBKDF2_KEY_LENGTH = 256; // Bytes
const PBKDF2_SALT_LENGTH = 16; // Bytes

export function generateSalt(saltLength = PBKDF2_SALT_LENGTH) {
  const array = new Uint8Array(saltLength);
  return Buffer.from(crypto.getRandomValues(array)).toString('hex');
}

export async function getDerivedKey(
  salt: string,
  password: string,
  iterations = PBKDF2_ITERATIONS,
  keyLength = PBKDF2_KEY_LENGTH,
) {
  const textEncoder = new TextEncoder();
  const passwordBuffer = textEncoder.encode(password);
  const importedKey = await crypto.subtle.importKey('raw', passwordBuffer, 'PBKDF2', false, [
    'deriveBits',
  ]);

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-512',
      salt: textEncoder.encode(salt),
      iterations,
    },
    importedKey,
    keyLength,
  );
  return Buffer.from(bits).toString('hex');
}

export async function compare(password: string, hash: string, salt: string) {
  const comparableHash = await getDerivedKey(salt, password);
  return comparableHash === hash;
}
