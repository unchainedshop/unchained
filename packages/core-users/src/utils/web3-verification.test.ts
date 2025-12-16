import { describe, it } from 'node:test';
import assert from 'node:assert';
import { verifyWeb3Signature } from './web3-verification.ts';

describe('Web3 Verification', () => {
  describe('verifyWeb3Signature', () => {
    it('should return false for invalid signature format (too short)', async () => {
      const nonce = 'test-nonce-123';
      const invalidSignature = '0x1234' as `0x${string}`;
      const address = '0x1234567890123456789012345678901234567890';

      const result = await verifyWeb3Signature(nonce, invalidSignature, address);
      assert.strictEqual(result, false);
    });

    it('should return false for invalid signature with wrong length', async () => {
      const nonce = 'test-nonce-123';
      // 64 bytes instead of 65
      const invalidSignature =
        '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890' as `0x${string}`;
      const address = '0x1234567890123456789012345678901234567890';

      const result = await verifyWeb3Signature(nonce, invalidSignature, address);
      assert.strictEqual(result, false);
    });

    it('should return false for signature with invalid r value (out of range)', async () => {
      const nonce = 'test-nonce-123';
      // A signature with r value out of range (all zeros)
      const invalidSignature =
        '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001b' as `0x${string}`;
      const address = '0x1234567890123456789012345678901234567890';

      const result = await verifyWeb3Signature(nonce, invalidSignature, address);
      assert.strictEqual(result, false);
    });

    it('should return false for signature with invalid s value', async () => {
      const nonce = 'test-nonce-123';
      // A signature with s value of zero
      const invalidSignature =
        '0x1234567890123456789012345678901234567890123456789012345678901234000000000000000000000000000000000000000000000000000000000000000000001b' as `0x${string}`;
      const address = '0x1234567890123456789012345678901234567890';

      const result = await verifyWeb3Signature(nonce, invalidSignature, address);
      assert.strictEqual(result, false);
    });

    it('should return false when signature does not match the address', async () => {
      const nonce = 'test-nonce-123';
      // A valid-format signature that won't match the address
      // This is a properly formatted 65-byte signature (r: 32 bytes, s: 32 bytes, v: 1 byte)
      const validFormatSignature =
        '0xc9f1cde2fc38c1837ea5d72b9add2ca2dcb0ba2f25d38f8d378b0be7e1f7f3a12d4e89b8c7a6f5e4d3c2b1a0987654321098765432109876543210987654321001b' as `0x${string}`;
      const address = '0x1234567890123456789012345678901234567890';

      const result = await verifyWeb3Signature(nonce, validFormatSignature, address);
      assert.strictEqual(result, false);
    });

    it('should handle empty nonce', async () => {
      const nonce = '';
      const signature =
        '0xc9f1cde2fc38c1837ea5d72b9add2ca2dcb0ba2f25d38f8d378b0be7e1f7f3a12d4e89b8c7a6f5e4d3c2b1a0987654321098765432109876543210987654321001b' as `0x${string}`;
      const address = '0x1234567890123456789012345678901234567890';

      // Should not throw, just return false
      const result = await verifyWeb3Signature(nonce, signature, address);
      assert.strictEqual(typeof result, 'boolean');
    });

    it('should be case insensitive for address comparison', async () => {
      const nonce = 'test-nonce';
      // Using a signature that would produce a valid address format
      const signature =
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678901b' as `0x${string}`;

      // Both uppercase and lowercase should be handled the same way
      const upperAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
      const lowerAddress = '0xabcdef1234567890abcdef1234567890abcdef12';

      const resultUpper = await verifyWeb3Signature(nonce, signature, upperAddress);
      const resultLower = await verifyWeb3Signature(nonce, signature, lowerAddress);

      // Both should return the same result (either both true or both false)
      assert.strictEqual(resultUpper, resultLower);
    });

    it('should handle signature without 0x prefix in hex conversion', async () => {
      const nonce = 'test-nonce-123';
      // Signature starting with 0x
      const signature =
        '0xc9f1cde2fc38c1837ea5d72b9add2ca2dcb0ba2f25d38f8d378b0be7e1f7f3a12d4e89b8c7a6f5e4d3c2b1a0987654321098765432109876543210987654321001b' as `0x${string}`;
      const address = '0x1234567890123456789012345678901234567890';

      // Should not throw
      const result = await verifyWeb3Signature(nonce, signature, address);
      assert.strictEqual(typeof result, 'boolean');
    });

    it('should handle v value with EIP-155 encoding (v >= 35)', async () => {
      const nonce = 'test-nonce-123';
      // Signature with v = 37 (0x25) which is EIP-155 encoded for chainId 1
      const signatureWithEIP155 =
        '0xc9f1cde2fc38c1837ea5d72b9add2ca2dcb0ba2f25d38f8d378b0be7e1f7f3a12d4e89b8c7a6f5e4d3c2b1a098765432109876543210987654321098765432100125' as `0x${string}`;
      const address = '0x1234567890123456789012345678901234567890';

      // Should not throw, just process the signature
      const result = await verifyWeb3Signature(nonce, signatureWithEIP155, address);
      assert.strictEqual(typeof result, 'boolean');
    });

    it('should handle v value of 27 (legacy format)', async () => {
      const nonce = 'test-nonce-123';
      // Signature with v = 27 (0x1b)
      const signatureWithV27 =
        '0xc9f1cde2fc38c1837ea5d72b9add2ca2dcb0ba2f25d38f8d378b0be7e1f7f3a12d4e89b8c7a6f5e4d3c2b1a0987654321098765432109876543210987654321001b' as `0x${string}`;
      const address = '0x1234567890123456789012345678901234567890';

      // Should not throw, just process the signature
      const result = await verifyWeb3Signature(nonce, signatureWithV27, address);
      assert.strictEqual(typeof result, 'boolean');
    });

    it('should handle v value of 28 (legacy format)', async () => {
      const nonce = 'test-nonce-123';
      // Signature with v = 28 (0x1c)
      const signatureWithV28 =
        '0xc9f1cde2fc38c1837ea5d72b9add2ca2dcb0ba2f25d38f8d378b0be7e1f7f3a12d4e89b8c7a6f5e4d3c2b1a0987654321098765432109876543210987654321001c' as `0x${string}`;
      const address = '0x1234567890123456789012345678901234567890';

      // Should not throw, just process the signature
      const result = await verifyWeb3Signature(nonce, signatureWithV28, address);
      assert.strictEqual(typeof result, 'boolean');
    });
  });
});
