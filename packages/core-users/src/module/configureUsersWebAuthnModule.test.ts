import { describe, it } from 'node:test';
import assert from 'node:assert';
import { toArrayBuffer, buf2hex } from './configureUsersWebAuthnModule.ts';

describe('WebAuthn Module', () => {
  describe('toArrayBuffer', () => {
    it('should convert a Buffer to an ArrayBuffer', () => {
      const buffer = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      const arrayBuffer = toArrayBuffer(buffer);

      assert.ok(arrayBuffer instanceof ArrayBuffer);
      assert.strictEqual(arrayBuffer.byteLength, 4);

      const view = new Uint8Array(arrayBuffer);
      assert.strictEqual(view[0], 0x01);
      assert.strictEqual(view[1], 0x02);
      assert.strictEqual(view[2], 0x03);
      assert.strictEqual(view[3], 0x04);
    });

    it('should handle empty buffers', () => {
      const buffer = Buffer.from([]);
      const arrayBuffer = toArrayBuffer(buffer);

      assert.ok(arrayBuffer instanceof ArrayBuffer);
      assert.strictEqual(arrayBuffer.byteLength, 0);
    });

    it('should handle buffers with offset', () => {
      const originalBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
      const slicedBuffer = originalBuffer.subarray(2, 5);
      const arrayBuffer = toArrayBuffer(slicedBuffer);

      assert.strictEqual(arrayBuffer.byteLength, 3);
      const view = new Uint8Array(arrayBuffer);
      assert.strictEqual(view[0], 0x02);
      assert.strictEqual(view[1], 0x03);
      assert.strictEqual(view[2], 0x04);
    });
  });

  describe('buf2hex', () => {
    it('should convert an ArrayBuffer to a hex string', () => {
      const buffer = new Uint8Array([0x01, 0x02, 0x0a, 0xff]).buffer;
      const hex = buf2hex(buffer);

      assert.strictEqual(hex, '01020aff');
    });

    it('should handle empty ArrayBuffer', () => {
      const buffer = new ArrayBuffer(0);
      const hex = buf2hex(buffer);

      assert.strictEqual(hex, '');
    });

    it('should pad single digit hex values with leading zero', () => {
      const buffer = new Uint8Array([0x00, 0x01, 0x0f]).buffer;
      const hex = buf2hex(buffer);

      assert.strictEqual(hex, '00010f');
    });

    it('should convert a 16-byte AAGUID to correct hex format', () => {
      // Typical AAGUID format: 16 bytes
      const aaguidBytes = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10,
      ]).buffer;
      const hex = buf2hex(aaguidBytes);

      assert.strictEqual(hex, '0102030405060708090a0b0c0d0e0f10');
      assert.strictEqual(hex.length, 32);

      // Format as UUID-style AAGUID
      const aaguid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      assert.strictEqual(aaguid, '01020304-0506-0708-090a-0b0c0d0e0f10');
    });
  });
});
